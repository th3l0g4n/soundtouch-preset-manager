function getStationItemParent(target) {
    while (target && !target.classList.contains('radio-item')) {
        target = target.parentElement;
    }
    return target;
}

const stationResponse = document.getElementById('station-response');
stationResponse.addEventListener('click', (e) => {
    const stationItem = getStationItemParent(e.target);
    if (stationItem) {
        stationResponse.querySelectorAll('.radio-item').forEach(item => item.classList.remove('selected'));
        stationItem.classList.add('selected');
        const uuid = stationItem.getAttribute('data-uuid');
        console.log('Selected station UUID:', uuid);
        document.getElementById('station-uuid').value = uuid;
    }
});
