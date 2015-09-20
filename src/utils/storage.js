var BKStorage = (function () {
    'use strict';

    var prefix = 'BACKAND';

    function Store (storeName, type) {

        var storageAPI;

        if( ['local', 'session'].indexOf(type) === -1 ) type = 'local';

        if (typeof window !== 'undefined' && typeof window[type + 'Storage'] !== 'undefined') {
            storageAPI = window[type + 'Storage'];
        } else {
            // We can fallback to other solution here inMemory Management
            // It could be cookies if needed
            storageAPI = {
                value: null,
                getItem: function (name, params) {
                    return this.value;
                },
                setItem: function (name, params) {
                    this.value = params;
                },
                removeItem: function (name, params) {
                    this.value = null;
                }
            };
        }

        this.command = function (action, params) {
            return storageAPI[action + 'Item'](prefix + storeName, params || null);
        };
    }

    Store.prototype.get = function () {
        return JSON.parse(this.command('get'));
    };

    Store.prototype.set = function (value) {
        return this.command('set', JSON.stringify(value));
    };

    Store.prototype.clear = function () {
        this.command('set');
        return this;
    };

    return {
        register: function (storeName, type) {
            if(!storeName) {
                throw Error('Invalid Store Name');
            }
            this[storeName] = new Store(storeName, type);
            return this;
        },

        remove: function (storeName) {
            this[storeName].command('remove');
            delete this[storeName];
            return this;
        }
    };

})();
