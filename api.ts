import { Client } from 'node-ssdp';
import { request as nodeRequest } from 'node:http';
import * as convert from 'xml-js';

function request(method: string, host: string, path: string, data?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = nodeRequest({
            method,
            host,
            port: 8090,
            path,
            headers: {
                "Content-Type": "application/xml"
            }
        }, res => {
            let data = '';
    
            res.on('data', resData => data += resData);
            res.on('end', () => resolve(JSON.parse(convert.xml2json(data, { compact: true }))));
        });

        req.on('error', reject);
        data && req.write(data);
        
        req.end();
    });
}

export function discover(timeout: number = 3000): Promise<any> {
    const client = new Client();
    const ssdpId = 'urn:schemas-upnp-org:device:MediaRenderer:1';
    const devices = new Map();

    return new Promise((res, _rej) => {
        client.on('response', (_headers: any, _code: any, info: any) => {
            devices.set(info.address, info);
        });

        setTimeout(() => res(Array.from(devices.values())), timeout);

        client.search(ssdpId);
    });
};

export function info(ip: string) {
    return request('GET', ip, '/info');
}

export function sources(ip: string) {
    return request('GET', ip, '/sources');
}

export function storePreset(ip: string, preset: any) {
    return request('POST', ip, '/storePreset', preset);
}