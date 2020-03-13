const config = {
    API_URI: 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByGeo/json',
    SEARCH_METER: 1000
};

const REMAIN_STATS = {
    plenty: '100개 이상',
    some: '30개 이상 100개미만',
    few: '2개 이상 30개 미만',
    empty: '1개 이하',
    break: '판매중지',
    null: '정보없음'
};
const pinInfoHtml = `
    <div class="pin-info">
        <div><img src="./resources/img/pin_current.svg"><p>현재 위치</p></div>
        <div><img src="./resources/img/pin_center.svg"><p>현위치 중심</p></div>
        <div><img src="./resources/img/pin_plenty.svg"><p>100개 이상</p></div>
        <div><img src="./resources/img/pin_some.svg"><p>30 ~ 100개</p></div>
        <div><img src="./resources/img/pin_few.svg"><p>2 ~ 30개</p></div>
        <div><img src="./resources/img/pin_empty.svg"><p>1개 이하</p></div>
        <div><img src="./resources/img/pin_empty.svg"><p>판매중지</p></div>
    </div>
`;

const currentBtnHtml = `<div class="btn-wrapper">
        <img src="./resources/img/btn_current.svg">
    </div>`;

function searchAddressToCoordinate(address) {
    if (!address) return;

    showOverlay();
    try {
        naver.maps.Service.geocode({
            query: address
        }, function(status, response) {
            if (status === naver.maps.Service.Status.ERROR) {
                alert('검색 중 에러가 발생했습니다!');
                hideOverlay();
                return;
            }

            if (response.v2.meta.totalCount === 0) {
                alert('검색 결과가 없습니다.');
                hideOverlay();
                return;
            }

            let item = response.v2.addresses[0],
                point = new naver.maps.Point(item.x, item.y);

            infoWindow.setContent(`
            <div style="padding:5px;min-width:150px;">
                <h4 style="margin-top:5px;">검색 주소 : ${address}</h4>
            </div>`);

            map.setCenter(point);
            infoWindow.open(map, point);
            hideOverlay();
        });
    } catch(e) {
        console.error(e);
    } finally {
        hideOverlay();
    }
}

function changeGeolocationCurrentCallback(e) {
    console.log(e);
    onSuccessGeolocation({
        coords: {
            latitude: e.coords.latitude,
            longitude: e.coords.longitude
        },
        isCurrentPos: true
    })
}

function changeGeolocationCurrentCenterCallback() {
    const currentPos = map.getCenter();
    onSuccessGeolocation({
        coords: {
            latitude: currentPos._lat,
            longitude: currentPos._lng
        },
        isCurrentPos: false
    })
}

function showMarker(map, marker) {
    if (marker.setMap()) return;
    marker.setMap(map);
}

function hideMarker(map, marker) {
    if (!marker.setMap()) return;
    marker.setMap(null);
}

function showOverlay() {
    document.getElementById('overlay').classList.add('show');
}

function hideOverlay() {
    document.getElementById('overlay').classList.remove('show');
}

function convertDateString(date) {
    if (!date) return '정보 없음';

    const yyyy = date.getFullYear();
    const mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
    const dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    const hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    const min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    const ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    
    return `${hh}시 ${min}분 ${ss}초<br>(${yyyy}년 ${mm}월 ${dd}일)`;
}

function convertMsToString(milliseconds) {
    const sec = parseInt(milliseconds / 1000 % 60);
    const min = parseInt(milliseconds / 1000 / 60 % 60);
    const hh = parseInt(milliseconds / 1000 / 60 / 60 % 24);
    const day = parseInt(milliseconds / 1000 / 60 / 60 / 24);

    const obj = {
        day, hh, min, sec
    }

    return Object.getOwnPropertyNames(obj).filter(k => obj[k] > 0).map(k => {
        switch(k) {
            case 'sec':
                return `${obj[k]}초`
            case 'min':
                return `${obj[k]}분`
            case 'hh':
                return `${obj[k]}시간`
            case 'day':
                return `${obj[k]}일`
            default:
                break;
        }
    }).join(' ');
}

function createGeolocation({addr, code, created_at, stock_at, name, remain_stat, lat, lng}) {
    const isExistOnly = document.getElementById('isExistOnly').checked;
    const isLatestStock = document.getElementById('isLatestStock').checked;

    if (isExistOnly && (!remain_stat || remain_stat === 'break' || remain_stat === 'empty' || remain_stat === undefined || remain_stat === null)) return;
    if (!stock_at || isLatestStock && new Date() - new Date(stock_at) > 60 * 60 * 1000) return;

    const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map: map,
        icon: `./resources/img/pin_${remain_stat === undefined || remain_stat === null ? 'empty' : remain_stat}.svg`
    });

    markers.push(marker);

    naver.maps.Event.addListener(marker, 'click', () => {
        infoWindow.setContent(`
        <div style="width:150px;text-align:center;padding:10px;">
            <a href="https://map.naver.com/?elat=${lat}&amp;elng=${lng}&amp;eelat=&amp;eelng=&amp;eText=${name}" target="_map_icon" class="btn_icon" onclick="return goOtherCR(this, 'a=loc_ipt*f.way&amp;r=2&amp;i=20488216&amp;g=mpi%3D09590520%3AqcT_%ED%8F%89%ED%99%94%EC%95%BD%EA%B5%AD&amp;u='+urlencode(urlexpand(this.href)));"><img width="39" height="18" title="길찾기" alt="길찾기" src="https://ssl.pstatic.net/sstatic/search/img3/btn_fndmap.gif"></a>
            <a>${name}</a>
            <p>${REMAIN_STATS[remain_stat ? remain_stat : 'null']}</p>
            <p>${stock_at ? (new Date(stock_at) > new Date() ? `입고 전<br/>${convertMsToString(new Date(stock_at) - new Date())}` : `입고 후<br/>${convertMsToString(new Date() - new Date(stock_at))}`) : '-'}</p>
            <p class="sub">입고시간: ${stock_at ? convertDateString(new Date(stock_at)) : '정보없음'}</p>
            <p class="sub">${addr}</p>
            <p class="sub">업데이트: ${created_at ? convertDateString(new Date(created_at)): '정보없음'}</p>
        </div>`);
        infoWindow.open(map, marker);
    });
}

function getApiUri(position) {
    return `${config.API_URI}?lat=${position.coords.latitude}&lng=${position.coords.longitude}&m=${config.SEARCH_METER}`;
}

async function onSuccessGeolocation(position) {
    showOverlay();
    markers.map((m) => {
        hideMarker(map, m);
    });
    infoWindow.close();

    const location = new naver.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
    );

    map.setCenter(location);

    console.log(position.isCurrentPos);
    const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(position.coords.latitude, position.coords.longitude),
        map: map,
        icon: position.isCurrentPos ? './resources/img/pin_current.svg': './resources/img/pin_center.svg'
    });

    markers.push(marker);
    circle.setCenter(location);

    try {
        const res = await axios.get(getApiUri(position), {timeout: 20000});

        console.log(res);

        res.data.stores.map(d => {
            createGeolocation(d);
        });
    } catch(e) {
        alert(`위치 정보 조회가 정상적이지 않습니다. 잠시후 다시 시도해 주세요..\n${e.message}`);
        console.error(e);
    } finally {
        hideOverlay();
    }
}

function onErrorGeolocation(e) {
    circle.setMap(null);
    const center = map.getCenter();

    infoWindow.setContent(`
    <div class="geo-location error">
        <h5 style="margin-bottom:5px;color:#f00;">Geolocation failed!</h5>error: ${e.code}, ${e.message}<br/>latitude: ${center.lat()}<br />longitude: ${center.lng()}
    </div>`);

    infoWindow.open(map, center);
}

let pos, map, infoWindow, circle;
let markers = [];

window.onload = async function () {
    document.getElementById('map').style = `width: 99%; height: ${document.documentElement.clientHeight - 150}px;`;
    document.getElementById('searchBtn').addEventListener('click', () => {
        searchAddressToCoordinate(document.getElementById('region').value);
    });
    document.getElementById('currentSearchBtn').addEventListener('click', () => {
        changeGeolocationCurrentCenterCallback();
    });

    map = new naver.maps.Map('map', {
        zoom: 16,
        minZoom: 13,
        zoomControl: true,
        zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
        },
        scaleControl: true,
        scaleControlOptions: {
            position: naver.maps.Position.BOTTOM_RIGHT
        },
        mapTypeId: naver.maps.MapTypeId.NORMAL
    });

    infoWindow = new naver.maps.InfoWindow({
        anchorSkew: true
    });

    circle = new naver.maps.Circle({
        map: map,
        radius: config.SEARCH_METER,
        fillColor: '#f0d0d0',
        fillOpacity: 0.3,
        strokeOpacity: 0.3
    });

    naver.maps.Event.addListener(map, 'click', () => {
        infoWindow.close();
    });

    naver.maps.Event.once(map, 'init_stylemap', function() {
        //customControl 객체 이용하기
        const customControl = new naver.maps.CustomControl(pinInfoHtml, {
            position: naver.maps.Position.TOP_LEFT
        });
        const customControlEl = customControl.getElement();

        customControl.setMap(map);

        setTimeout(() => {
            customControlEl.classList.add('hide');
        }, 3000);
        naver.maps.Event.addDOMListener(customControlEl, 'click', function() {
            if (customControlEl.classList.contains('hide')) {
                customControlEl.classList.remove('hide');
            } else {
                customControlEl.classList.add('hide');
            }
        });
    });

    naver.maps.Event.once(map, 'init_stylemap', function() {
        if (!navigator.geolocation) {
            return;
        }
        const customControl = new naver.maps.CustomControl(currentBtnHtml, {
            position: naver.maps.Position.BOTTOM_LEFT
        });
        const customControlEl = customControl.getElement();

        customControl.setMap(map);
        naver.maps.Event.addDOMListener(customControlEl, 'click', function() {
            navigator.geolocation.getCurrentPosition(changeGeolocationCurrentCallback, onErrorGeolocation);
        });
    });
    if (!navigator.geolocation) {
        const center = map.getCenter();
        infoWindow.setContent(`
        <div class="geo-location">
            <h5 style="margin-bottom:5px;color:#f00;">Geolocation not supported</h5>
        </div>`);
        infoWindow.open(map, center);
        return;
    }

    const positionOption = { timeout: 10000, enableHighAccuracy: false };
    navigator.geolocation.getCurrentPosition(changeGeolocationCurrentCallback, onErrorGeolocation, positionOption);
};