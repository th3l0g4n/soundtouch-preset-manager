import { serve } from 'bun';
import indexhtml from './index.html';
import { info, discover , storePreset} from './api';

serve({
    routes: {
        '/': indexhtml,
        '/api/discover': async () => {
            const devices = await discover(3000);
            const infoproms = devices.map(device => info(device.address));
            const infos = await Promise.all(infoproms);
           
            return new Response(
                infos.map(info => `
                    <input type="checkbox" name="device" checked id="device-${info.info.networkInfo[0].ipAddress._text}" value="${info.info.networkInfo[0].ipAddress._text}"/>
                    <label for="device-${info.info.networkInfo[0].ipAddress._text}">${info.info.name._text} (${info.info.type._text})</label>
                `).join(''),
                {
                    headers: {
                        'Content-Type': 'text/html'
                    }
                }
            )
        },
        '/api/stations': async (req) => {
            const url = new URL(req.url);
            const station = url.searchParams.get('station');
            if (!station) {
                return new Response('Missing station query parameter', { status: 400 });
            }

            const stations = await fetch(`https://all.api.radio-browser.info/json/stations/byname/${encodeURIComponent(station)}?limit=20&order=clickcount&reverse=true`).then(res => res.json());
            
            return new Response(
                stations.map((station: any) => `
                    <div class="radio-item" data-uuid="${station.stationuuid}">
                        <img src="${station.favicon}" alt="${station.name}">
                        <div class="radio-info">
                            <div class="radio-name">${station.name}</div>
                            <div class="radio-tags">${station.country || ''}${station.tags ? ' · ' + station.tags.split(',').slice(0, 3).join(', ') : ''}</div>
                        </div>
                    </div>
                `).join(''),
                {
                    headers: {
                        'Content-Type': 'text/html'
                    }
                }
            );
        },
        '/api/savePreset': async (req) => {
            const formData = await req.formData();
            const devices = formData.getAll('device') as string[];
            const stationUuid = formData.get('station-uuid');
            const presetButton = formData.get('preset-button');

            const stationRes = await fetch(`https://all.api.radio-browser.info/json/stations/byuuid/${encodeURIComponent(stationUuid)}`);
            const stationData = await stationRes.json();
            const station = stationData[0];

            if (!station) {
                return new Response('Station not found', { status: 404 });
            }

            const presetTpl = (presetButton, station) => `<preset id="${presetButton}">
                <ContentItem source="LOCAL_INTERNET_RADIO" type="stationurl" location="http://all.api.radio-browser.info/soundtouch/stations/byuuid/${station.stationuuid}">
                    <itemName>${station.name}</itemName>
                    <containerArt>${station.favicon}</containerArt>
                </ContentItem>
            </preset>`;

            const storePromises = devices.map((ip: string) => storePreset(ip, presetTpl(presetButton, station)));
            return await Promise.all(storePromises).then((results) => {
                // console.log('Preset stored on devices:', results);
                return new Response('Preset saved successfully');
            }).catch((error) => {
                console.error('Error storing preset:', error);
                return new Response('Error storing preset', { status: 500 });
            });
        }
    }
})