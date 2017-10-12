Array.prototype.inArrayCheck = function (needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
        if (haystack[i] === needle) {
            return true;
        }
    }
    return false;
};

var illuminatiJsAgent = {

    passElementType : ['form', 'input', 'select', 'textarea'],
    illuminatiInputElementType : ['text', 'radio', 'checkbox'],

    init : function () {
    },

    generateUDID : function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    },

    generateGlobalTransactionId : function () {
        var gTransactionId = [];
        for (var i=0; i<8; i++) {
            gTransactionId[gTransactionId.length] = this.generateUDID();
        }

        return gTransactionId.join('')+'-illuminatiGProcId';
    },

    getElementUniqueId : function (elementObj) {
        return (typeof elementObj.id !== 'undefined' && elementObj.id !== null && elementObj.id.trim() !== '') ? elementObj.id : elementObj.name;
    },

    checkPassElement : function (elem) {
        if (Array.prototype.inArrayCheck(elem.localName, this.passElementType) === false) {
            return true;
        }

        if (typeof elem.getAttribute('id') === 'undefined' && elem.getAttribute('name') === 'undefined') {
            return true;
        }

        var isUniqueIdEmptyCheck = false;
        if (typeof elem.getAttribute('id') !== 'undefined' && elem.getAttribute('id') != null && elem.getAttribute('id').trim() === '') {
            isUniqueIdEmptyCheck = true;
        }
        if (typeof elem.getAttribute('name') !== 'undefined' && elem.getAttribute('name') != null  && elem.getAttribute('name').trim() === '') {
            isUniqueIdEmptyCheck = true;
        }
        if (isUniqueIdEmptyCheck === true) {
            return true;
        }

        if (elem.localName === 'input' && Array.prototype.inArrayCheck(elem.type, this.illuminatiInputElementType) === false) {
            return true;
        }

        return false;
    },

    getScreenInfoAtEvent : function (e) {
        var clientScreenInfo = {
            browserWidth: window.innerWidth || document.body.clientWidth,
            browserHeight: window.innerHeight || document.body.clientHeight,
            clientX: e.clientX,
            clientY: e.clientY,
            layerX: e.layerX,
            layerY: e.layerY,
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            screenX: e.screenX,
            screenY: e.screenY,
            x: e.x,
            y: e.y
        };

        return clientScreenInfo;
    },

    getElementObj : function (object) {
        if (typeof object['id'] !== 'undefined' && object['id'] !== null && object['id'].trim() !== '') {
            return document.getElementById(object['id'].trim());
        } else if (typeof object['name'] !== 'undefined' && object['name'] !== null && object['name'].trim() !== '') {
            return document.getElementsByName(object['name'].trim());
        }

        return null;
    },

    getChangedAttributeValue : function (attributeName, oldData, newData) {
        var changedValue = {};
        changedValue['attributeName'] = attributeName;
        changedValue['old'] = oldData;
        changedValue['new'] = newData;

        return changedValue;
    },

    getEventData : function (e) {
        var eventObject = {};
        var objectAttributes = {};

        for (var i=0; i<e.target.attributes.length; i++) {
            var item = e.target.attributes.item(i);

            switch (item.name) {
                case 'id' :
                    eventObject['id'] = item.value;
                case 'name' :
                    eventObject['name'] = item.value;

                default:
                    objectAttributes[item.name] = item.value;
                    break;
            }
        }

        if (e.target.type.indexOf('textarea') > -1) {
            var tempTextareaObj = illuminatiJsAgent.getElementObj(eventObject);
            objectAttributes['value'] = tempTextareaObj.value;
        }

        eventObject['attributes'] = objectAttributes;
        eventObject['obj'] = illuminatiJsAgent.getElementObj(eventObject);

        if (e.target.type.indexOf('select') > -1) {
            var firstElementData = JSON.parse(sessionStorage.getItem('illuminati'));
            var key = e.target.type + '-' + this.getElementUniqueId(eventObject);

            eventObject['obj'] = firstElementData[key];
        } else if (eventObject['attributes'].hasOwnProperty('type') === true) {
            if (eventObject['attributes']['type'] === 'checkbox') {
                eventObject['checked'] = e.target.checked;
            } else if (eventObject['attributes']['type'] === 'radio') {
                var firstElementData = JSON.parse(sessionStorage.getItem('illuminati'));
                var key = e.target.type + '-' + this.getElementUniqueId(eventObject);

                eventObject['obj'] = firstElementData[key];
            }
        }

        eventObject['elementUniqueId'] = this.getElementUniqueId(eventObject);
        eventObject['target'] = e.target;

        return eventObject;
    },

    getNewEventData : function (oldObject) {
        var newObject = {};
        var targetObject = oldObject.target;

        newObject['id'] = targetObject.getAttribute('id');
        newObject['name'] = targetObject.getAttribute('name');

        var tmpTargetObject = illuminatiJsAgent.getElementObj(newObject);
        if (tmpTargetObject !== null) {
            targetObject = tmpTargetObject;
        }

        var objectAttributes = {};
        var changedInfo = {};

        objectAttributes['elementUniqueId'] = oldObject.elementUniqueId;
        objectAttributes['type'] = oldObject.target.type;
        objectAttributes['target'] = oldObject.target;

        changedInfo['changedValue'] = [];

        if (typeof oldObject.target.type !== 'undefined') {
            if (oldObject.target.type.indexOf('select') > -1) {
                for (var q=0; q<oldObject.obj.option.length; q++) {
                    var tempSelectOption = oldObject.obj.option[q];

                    if ((tempSelectOption.hasOwnProperty('selected') === true && targetObject[q].selected === false)
                        || (tempSelectOption.hasOwnProperty('selected') === false && targetObject[q].selected === true)) {
                        changedInfo['changedValue'][changedInfo['changedValue'].length] = illuminatiJsAgent.getChangedAttributeValue('selected', tempSelectOption.hasOwnProperty('selected'), targetObject[q].selected);

                        Object.keys(tempSelectOption).map(function(objectKey, index) {
                            objectAttributes[objectKey] = eval('tempSelectOption.' + objectKey);
                        });
                    }
                }

                objectAttributes['obj'] = oldObject.obj;
                objectAttributes['id'] = oldObject.id;
                objectAttributes['name'] = oldObject.name;
            } else if (oldObject.target.type.indexOf('radio') > -1) {
                objectAttributes['type'] = 'radio';

                for (var p=0; p<oldObject.obj.length; p++) {
                    var tempOldRadioObj = oldObject.obj[p];

                    if ((tempOldRadioObj.hasOwnProperty('checked') === true && targetObject[p].checked === false)
                        || (tempOldRadioObj.hasOwnProperty('checked') === false && targetObject[p].checked === true)) {
                        changedInfo['changedValue'][changedInfo['changedValue'].length] = illuminatiJsAgent.getChangedAttributeValue('checked', tempOldRadioObj.hasOwnProperty('checked'), targetObject[p].checked);

                        Object.keys(tempOldRadioObj).map(function(objectKey, index) {
                            objectAttributes[objectKey] = eval('tempOldRadioObj.' + objectKey);
                        });
                    }
                }
            } else if (oldObject.target.type.indexOf('checkbox') > -1) {
                if ((oldObject.checked === true && targetObject.checked === false)
                    || (oldObject.checked === false && targetObject.checked === true)) {
                    changedInfo['changedValue'][0] = illuminatiJsAgent.getChangedAttributeValue('checked', oldObject.checked, targetObject.checked);

                    for (var i=0; i<targetObject.attributes.length; i++) {
                        var item = targetObject.attributes.item(i);
                        objectAttributes[item.name] = eval('targetObject.' + item.name);
                    }
                }
            } else {
                for (var i=0; i<targetObject.attributes.length; i++) {
                    var item = targetObject.attributes.item(i);
                    objectAttributes[item.name] = eval('targetObject.' + item.name);
                }

                if (oldObject.obj.type.indexOf('textarea') > -1) {
                    objectAttributes['value'] = targetObject.value;
                }

                Object.keys(objectAttributes).map(function(objectKey, index) {
                    var value = objectAttributes[objectKey];

                    if (oldObject.attributes.hasOwnProperty(objectKey) === true
                        && (oldObject.attributes[objectKey] !== objectAttributes[objectKey])) {
                        changedInfo['changedValue'][0] = illuminatiJsAgent.getChangedAttributeValue(objectKey, oldObject.attributes[objectKey], objectAttributes[objectKey]);
                    } else {
                        changedInfo['removedKey'] = objectKey;
                    }
                });
            }
        }

        if (changedInfo['changedValue'].length > 0) {
            objectAttributes['changedInfo'] = changedInfo;
        }

        return objectAttributes;
    },

    setElementToSessionStorage : function (newObject) {
        if (newObject.hasOwnProperty('changedInfo') === true) {
            var elementStore = JSON.parse(sessionStorage.getItem('illuminati'));
            var key = newObject.target.type + '-' + newObject.elementUniqueId

            if (Array.isArray(elementStore[key]) === false) {
                elementStore[key]['changedInfo'] = newObject.changedInfo;
            } else {
                var tempArray = elementStore[key];
                elementStore[key] = {
                    obj: tempArray,
                    type: newObject.type,
                    changedInfo: newObject.changedInfo
                };
            }

            elementStore['alreadySent'] = 'ready';
            sessionStorage.setItem('illuminati', JSON.stringify(elementStore));
        }
    }
};

var illuminatiGProcId = illuminatiJsAgent.generateGlobalTransactionId();

var lastCheckObject;

var interval = setInterval(function() {
    if(document.readyState === 'complete') {
        clearInterval(interval);
        // document ready
        var elems = document.body.getElementsByTagName("*");

        var tempRadioStore = {};
        var elementStore = {};

        for (var i=0; i<elems.length; i++) {
            var elem = elems[i];

            if (illuminatiJsAgent.checkPassElement(elem) == true) {
                continue;
            }

            var elementObj = {
                obj: elem,
                type: elem.type,
                id: elem.getAttribute('id'),
                name: elem.getAttribute('name')
            };

            if (elem.localName === 'form') {
                elementObj['type'] = 'form';
            }

            var elementUniqueId = illuminatiJsAgent.getElementUniqueId(elementObj);

            if (elem.localName === 'input' && elem.getAttribute('type') === 'radio') {
                if (tempRadioStore.hasOwnProperty(elementObj.type + '-' + elementUniqueId) === false) {
                    tempRadioStore[elementObj.type + '-' + elementUniqueId] = [];
                }

                var radio = {};
                for (var j = 0; j < elem.attributes.length; j++) {
                    var item = elem.attributes.item(j);
                    radio[item.name] = item.value;
                }

                radio['obj'] = elem;
                tempRadioStore[elementObj.type + '-' + elementUniqueId][tempRadioStore[elementObj.type + '-' + elementUniqueId].length] = radio;

                continue;
            }

            for (var j = 0; j < elem.attributes.length; j++) {
                var item = elem.attributes.item(j);

                if (elem.localName === 'select') {
                    elementObj['option'] = [];

                    for (var k=0; k<elem.childElementCount; k++) {
                        var option = {};
                        for (var m=0; m<elem[k].attributes.length; m++) {
                            var optionItem = elem[k].attributes.item(m);
                            option[optionItem.name] = optionItem.value;
                        }

                        elementObj['option'][elementObj['option'].length] = option;
                    }
                } else {
                    elementObj[item.name] = item.value;
                }
            }

            if (elem.localName === 'textarea') {
                elementObj['value'] = elem.value;
            }

            var key = elementObj.type + '-' + elementUniqueId;

            elementStore[key] = elementObj;
        }

        for (var key in tempRadioStore) {
            elementStore[key] = tempRadioStore[key];
        }

        for (var key in elementStore) {
            var eventElem = elementStore[key];

            if (Array.isArray(eventElem) !== true) {
                switch (eventElem.type) {
                    case 'text' :
                        eventElem['obj'].addEventListener('keyup', function (e) {
                            var screenInfo = illuminatiJsAgent.getScreenInfoAtEvent(e);
                            var oldObject = illuminatiJsAgent.getEventData(e);
                            var newObject = illuminatiJsAgent.getNewEventData(oldObject);
                            newObject['screenInfo'] = screenInfo;
                            illuminatiJsAgent.setElementToSessionStorage(newObject);
                        });
                        break;
                    case 'textarea' :
                        var screenInfo;
                        eventElem['obj'].addEventListener('focusin', function (e) {
                            screenInfo = illuminatiJsAgent.getScreenInfoAtEvent(e);
                            lastCheckObject = illuminatiJsAgent.getEventData(e);
                        });
                        eventElem['obj'].addEventListener('keyup', function (e) {
                            var newObject = illuminatiJsAgent.getNewEventData(lastCheckObject);
                            newObject['screenInfo'] = screenInfo;
                            illuminatiJsAgent.setElementToSessionStorage(newObject);
                        });
                        break;
                    case 'select-one' :
                        eventElem['obj'].addEventListener('change', function (e) {
                            var screenInfo = illuminatiJsAgent.getScreenInfoAtEvent(e);
                            var oldObject = illuminatiJsAgent.getEventData(e);
                            var newObject = illuminatiJsAgent.getNewEventData(oldObject);
                            newObject['screenInfo'] = screenInfo;
                            illuminatiJsAgent.setElementToSessionStorage(newObject);
                        });
                        break;

                    case 'form' :
                        eventElem['obj'].addEventListener('submit', function (e) {
                            if (e.preventDefault) {
                                e.preventDefault();
                            }

                            /* do something */

                            // return false to prevent the default form behavior
                            return false;
                        });
                        break;

                    default :
                        var screenInfo;
                        eventElem['obj'].addEventListener('mouseup', function (e) {
                            screenInfo = illuminatiJsAgent.getScreenInfoAtEvent(e);
                            lastCheckObject = illuminatiJsAgent.getEventData(e);
                        });
                        eventElem['obj'].addEventListener('click', function (e) {
                            var newObject = illuminatiJsAgent.getNewEventData(lastCheckObject);
                            newObject['screenInfo'] = screenInfo;
                            delete(lastClickObject);
                            illuminatiJsAgent.setElementToSessionStorage(newObject);
                        });
                        break;
                }
            } else {
                for (var n=0; n<eventElem.length; n++) {
                    var tmpRadioObj = eventElem[n];
                    tmpRadioObj['obj'].addEventListener('click', function (e) {
                        var screenInfo = illuminatiJsAgent.getScreenInfoAtEvent(e);
                        var oldObject = illuminatiJsAgent.getEventData(e);
                        var newObject = illuminatiJsAgent.getNewEventData(oldObject);
                        newObject['screenInfo'] = screenInfo;
                        illuminatiJsAgent.setElementToSessionStorage(newObject);
                    });
                }
            }
        }

        elementStore['illuminatiGProcId'] = illuminatiGProcId;
        elementStore['alreadySent'] = 'done';

        sessionStorage.setItem('illuminati', JSON.stringify(elementStore));
    }
}, 100);

var illuminatiAjax = {
    xmlHttp : null,
    xmlHttpObjType : null,
    isAsync : true,

    // IE browser check
    checkIEBrowser : function (vCheck) {
        if(navigator.appName.toLowerCase() == "microsoft internet explorer") {
            var tmpAppVersion = navigator.appVersion.toLowerCase();

            var pos = tmpAppVersion.indexOf("msie");
            var ver = tmpAppVersion.substr(pos,8);

            if (vCheck == null || vCheck == 'undefined') {
                return true;
            } else {
                if (sLogger.utils.includeArrayData(vCheck, ver)) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        return false;
    },

    init : function () {
        // if (typeof XDomainRequest !== 'undefined'){
        //     this.xmlHttp = new XDomainRequest();
        //     this.xmlHttpObjType = 'XDomain';
        // } else

        if (window.XMLHttpRequest) {
            this.xmlHttp = new XMLHttpRequest();
            this.xmlHttpObjType = 'XML';
        } else {
            this.xmlHttpObjType = 'ActiveX';
            try {
                this.xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    this.xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
                } catch (e) {
                }
            }
        }
    },

    sendByPost : function (requestUrl, data) {
        // IE 6, 7 does not support cross-domain request. because of send POST method using hidden iframe.
        var msieVersion = new Array('msie 6.0', 'msie 7.0');

        if (this.checkIEBrowser(msieVersion) == true) {
            // not yet
        } else {
            // if (xmlHttpObjType === 'XDomain') {
            //     this.xmlHttp.onerror = this.error;
            //     this.xmlHttp.ontimeout = this.timeout;
            //     this.xmlHttp.contentType = ;
            //     this.xmlHttp.onload = this.handleStateChange;
            //     this.xmlHttp.timeout = 3000;
            //     this.xmlHttp.open('POST', '/illuminati/js/collector');
            //     this.xmlHttp.send(data);
            // } else {
                this.xmlHttp.open('POST', requestUrl, this.isAsync);

                // if (this.ajaxSendCheck === true) {
                //     this.xmlHttp.onreadystatechange = this.handleStateChange;
                // }

                this.xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                //xmlHttp.withCredentials = true;
                this.xmlHttp.send(data);

                // basic timeout check (tree second)
                // if (ajaxSendCheck) {
                //     setTimeout(function() {
                //         xmlHttp.abort();
                //
                //         if (xmlHttpTimeoutChacker) {
                //             sLogger.ajaxModule.errorLog("ajax target server timeout", 509, "target server has timeout to connect. please check target server.");
                //             sLogger.ajaxModule.errorDebug();
                //         }
                //
                //         executeQueue.splice(0, 1);
                //         sLogger.logData.executeAjax(false);
                //     }, ajaxTimeoutSec);
                // }
            //}

            // if (!ajaxSendCheck) {
            //     return this.handleStateChange();
            // }
        }
    }
};

var sendToIlluminati = setInterval(function () {
    var elementStore = JSON.parse(sessionStorage.getItem('illuminati'));
    if (elementStore['alreadySent'] === 'ready') {
        //sessionStorage.setItem('illuminati-buffer', JSON.stringify(elementStore));
        elementStore['alreadySent'] = 'sending'
        //sessionStorage.setItem('illuminati', JSON.stringify(elementStore));

        var illuminatiJsModel = {
            illuminatiGProcId: elementStore.illuminatiGProcId,
            changedJsElement: []
        };

        var ignoreCheckEventStoreKeys = ['alreadySent', 'illuminatiGProcId'];
        Object.keys(elementStore).map(function(objectKey, index) {
            if (Array.prototype.inArrayCheck(objectKey, ignoreCheckEventStoreKeys) === false) {
                if (elementStore[objectKey].hasOwnProperty('changedInfo') === true) {
                    var changedObj = elementStore[objectKey];

                    var changedElementInfo = {
                        changedInfo: {
                            value: changedObj['changedInfo'],
                            obj: []
                        }
                    };

                    if (Array.isArray(changedObj.obj) === true) {
                        changedElementInfo.changedInfo.obj = changedObj.obj;
                    } else {
                        var ignoreKeyName = ['changedInfo', 'obj'];
                        changedElementInfo.changedInfo.obj[0] = {};
                        Object.keys(changedObj).map(function(objectInnerKey, InnerIndex) {
                            if (Array.prototype.inArrayCheck(objectInnerKey, ignoreKeyName) === false) {
                                changedElementInfo.changedInfo.obj[0][objectInnerKey] = changedObj[objectInnerKey];
                            }
                        });
                    }

                    illuminatiJsModel.changedJsElement[illuminatiJsModel.changedJsElement.length] = changedElementInfo;
                }
            }
        });

        console.log(illuminatiJsModel);
    }
}, 10000);

illuminatiAjax.init();
illuminatiAjax.sendByPost('/api/v1/test1', {test: 'a'});
console.log(illuminatiAjax.xmlHttp);