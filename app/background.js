function log(message) {
    console.log(message);
}

var services = [];

function loadService(serviceName, serviceIndexData) {
    jQuery.ajax('http://tos-dr.info/services/' + serviceName + '.json', { success: function (service) {
        service.urlRegExp = new RegExp('https?://[^:]*' + service.url + '.*');
        service.points = serviceIndexData.points;
        service.links = serviceIndexData.links;
        if (!service.tosdr) {
            service.tosdr = { rated: false };
        }
        services.push(service);
        localStorage.setItem(serviceName, JSON.stringify(service));
    }
    });
}


jQuery.ajax('http://tos-dr.info/index/services.json', { success: function (servicesIndex) {
    for (var serviceName in servicesIndex) {
        loadService(serviceName, servicesIndex[serviceName]);
    }
}
});


function getService(tab) {
    var matchingServices = services.filter(function (service) {
        return service.urlRegExp.exec(tab.url);
    });
    return matchingServices.length > 0 ? matchingServices[0] : null;
}

function getIconForService(service) {
    var rated = service.tosdr.rated;
    var imageName = rated ? rated.toLowerCase() : 'false';
    return '/images/class/' + imageName + '.png';
}


function checkNotification(service) {

    var last = localStorage.getItem('notification/' + service.name + '/last/update');
    var lastRate = localStorage.getItem('notification/' + service.name + '/last/rate');
    var shouldShow = false;

    if (!service.tosdr.rated) { return; }

    var rate = service.tosdr.rated;
    console.log(rate);
    if (rate === 'D' || rate === 'E') {

        if (last) {
            var lastModified = parseInt(Date.parse(last));
            log(lastModified);
            var daysSinceLast = (new Date().getTime() - lastModified) / (1000 * 60 * 60 * 24);
            log(daysSinceLast);

            if (daysSinceLast > 7) {
                shouldShow = true;
            }
        } else {
            shouldShow = true;
        }

    } else if (lastRate === 'D' || lastRate === 'E') {
        shouldShow = true;
    }


    if (shouldShow) {

        localStorage.setItem('notification/' + service.name + '/last/update', new Date().toDateString());
        localStorage.setItem('notification/' + service.name + '/last/rate', rate);
        var notification = webkitNotifications.createHTMLNotification('notification.html#' + service.id);
        notification.show();
        console.log(notification);
    }



}

function onUrlChanged(tabId, changeInfo, tab) {
    var service = getService(tab);
    if (service) {
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: getIconForService(service)
        });
        chrome.pageAction.setPopup({
            tabId: tabId,
            popup: 'popup.html#' + service.id
        })
        chrome.pageAction.show(tabId);

        checkNotification(service);
    }
}

chrome.tabs.onUpdated.addListener(onUrlChanged);