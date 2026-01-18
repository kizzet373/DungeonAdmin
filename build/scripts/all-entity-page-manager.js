window.createEntityPageManager = function(context, onUpdateCallback, tabConfig = {}) {
    let _entityData = []; 
    let _filteredEntityData = []; 
    let _activeFilter = {}; 
    let _activeTab = 0; 
    let _availableTabValues = [];
    let _isUpdatingHashProgrammatically = false;

    const _tabProperty = tabConfig.tabProperty; 
    const _tabValues = tabConfig.tabValues || []; 

    const manager = {
        get activeFilter() { return _activeFilter },
        get activeTab() { return _activeTab },
        get availableTabValues() { return _availableTabValues },

        _notifyContext: function() {
            const normalFilters = { ..._activeFilter };
            if (_tabProperty) {
                delete normalFilters[_tabProperty]; 
            }
            
            _filteredEntityData = _entityData.filter(item =>
                this._itemMatchesFilters(item, normalFilters)
            );

            this._updateAvailableTabValues();

            this._updateActiveTab();

            if (typeof onUpdateCallback === 'function') {
                onUpdateCallback({ ..._activeFilter }, _filteredEntityData, _activeTab, _availableTabValues);
            }
        },

        initialize: function() {
            this.setFilterFromHash(); 
            window.addEventListener('hashchange', () => {
              if (!_isUpdatingHashProgrammatically) {
                this.setFilterFromHash();
              }
              _isUpdatingHashProgrammatically = false; 
            });
        },

        setFilterFromHash: function() {
            const hash = window.location.hash.substring(1);
            const newFilter = {};
            if (hash) {
                const filterPairs = hash.split('&');
                for (const pair of filterPairs) {
                    const [key, value] = pair.split(':');
                    if (key && value) {
                        newFilter[key] = value.toLowerCase();
                    }
                }
            }
            if (JSON.stringify(_activeFilter) !== JSON.stringify(newFilter)) {
                _activeFilter = newFilter;
                this._notifyContext();
            } else if (_activeFilter[_tabProperty] !== (newFilter[_tabProperty] || _tabValues[0])) {
                this._notifyContext(); 
            }
        },

        setFilter: function(key, value) {
            if (_activeFilter[key] !== value) {
              _activeFilter = { ..._activeFilter, [key]: value };
              this.updateUrlHash();
              this._notifyContext();
            } else if (_activeFilter[key] === value && _activeTab !== value) {
              this._notifyContext();
            }
        },

        clearFilter: function(key) {
            if (_activeFilter.hasOwnProperty(key)) {
                const newFilter = { ..._activeFilter };
                delete newFilter[key];
                _activeFilter = newFilter;
                this.updateUrlHash();
                this._notifyContext();
            }
        },

        clearAllFilters: function() {
            if (Object.keys(_activeFilter).length > 0) {
                _activeFilter = {};
                _isUpdatingHashProgrammatically = true;
                window.location.hash = '';
                this._notifyContext();
            }
        },

        updateUrlHash: function() {
            const hashParts = [];
            for (const key in _activeFilter) {
                hashParts.push(`${key}:${_activeFilter[key]}`);
            }
            const newHash = hashParts.join('&');
            if (window.location.hash.substring(1) !== newHash) {
                _isUpdatingHashProgrammatically = true;
                window.location.hash = newHash;
            }
        },

        _itemMatchesFilters: function(item, filters) {
            for (const key in filters) {
                if (filters.hasOwnProperty(key)) {
                    const filterValue = filters[key];

                    if (filterValue === undefined || filterValue === '') {
                        continue;
                    }

                    if (item[key] === undefined) {
                        return false;
                    }

                    if (key === 'class') {
                         if (Array.isArray(item.class)) {
                             if (!item.class.map(s => String(s).toLowerCase()).includes(String(filterValue).toLowerCase())) {
                                 return false;
                             }
                         } else if (typeof item.class === 'string') {
                             const itemClassValueLower = String(item.class).toLowerCase();
                             const filterClassValueLower = String(filterValue).toLowerCase();
                             const parts = itemClassValueLower.split(/,\s*| or /).map(s => s.trim());
                             if (!parts.includes(filterClassValueLower)) {
                                 return false;
                             }
                         } else {
                             return false;
                         }
                    }
                    else if (Array.isArray(item[key])) {
                        if (!item[key].map(s => String(s).toLowerCase()).includes(String(filterValue).toLowerCase())) {
                            return false;
                        }
                    } else if (typeof item[key] === 'string') {
                        const itemValueLower = String(item[key]).toLowerCase();
                        const filterValueLower = String(filterValue).toLowerCase();

                        if (itemValueLower.includes(',') || itemValueLower.includes(' or ')) {
                            const parts = itemValueLower.split(/,\s*| or /).map(s => s.trim());
                            if (!parts.includes(filterValueLower)) {
                                return false;
                            }
                        } else if (itemValueLower !== filterValueLower) {
                            return false;
                        }
                    } else if (typeof item[key] === 'number') {
                        if (item[key] !== parseInt(filterValue, 10)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },

        _updateAvailableTabValues: function() {
            _availableTabValues = [];
            const normalFilters = { ..._activeFilter };
            if (_tabProperty) {
                delete normalFilters[_tabProperty]; 
            }

            _tabValues.forEach(tabValue => {
                const hasEntities = _entityData.some(item =>
                    this._itemMatchesFilters(item, normalFilters) && item[_tabProperty] === tabValue
                );
                if (hasEntities) {
                    _availableTabValues.push(tabValue);
                }
            });
        },

        _updateActiveTab: function() {
            if (!_tabProperty || _tabValues.length === 0) {
                _activeTab = 0;
                return;
            }

            const currentTabFilterValue = _activeFilter[_tabProperty];
            let newActiveTabValue;

            if (currentTabFilterValue !== undefined && currentTabFilterValue !== '') {
                const targetTabValue = currentTabFilterValue;
                if (_availableTabValues.includes(targetTabValue)) {
                    newActiveTabValue = targetTabValue;
                } else {
                    newActiveTabValue = this._findFirstAvailableTab();
                }
            } else {
                newActiveTabValue = this._findFirstAvailableTab();
            }

            if (_activeTab !== newActiveTabValue) {
                _activeTab = newActiveTabValue;
            }
        },

        _findFirstAvailableTab: function() {
            if (_availableTabValues.length > 0) {
                return _availableTabValues[0];
            }
            return _tabValues.length > 0 ? _tabValues[0] : 0;
        },

        checkIfTabHasEntities: function(tabValue) {
            const normalFilters = { ..._activeFilter };
            if (_tabProperty) {
                delete normalFilters[_tabProperty];
            }
            const hasEntities = _entityData.some(item =>
                this._itemMatchesFilters(item, normalFilters) && item[_tabProperty] === tabValue
            );
            return hasEntities;
        },

        getFilteredData: function() {
            return _filteredEntityData;
        },

        getUniquePropertyValues: function(propertyName) {
            const values = new Set();
            _entityData.forEach(item => {
                if (item[propertyName] !== undefined) {
                    if (propertyName === 'class') {
                         if (Array.isArray(item.class)) {
                             item.class.forEach(cls => values.add(String(cls).toLowerCase()));
                         } else if (typeof item.class === 'string' && (item.class.includes(',') || item.class.includes(' or '))) {
                             item.class.split(/,\s*| or /).forEach(cls => values.add(cls.trim().toLowerCase()));
                         } else if (typeof item.class === 'string') {
                             values.add(String(item.class).toLowerCase());
                         }
                    } else if (Array.isArray(item[propertyName])) {
                        item[propertyName].forEach(val => values.add(String(val).toLowerCase()));
                    } else if (typeof item[propertyName] === 'string' && (item[propertyName].includes(',') || item[propertyName].includes(' or '))) {
                        item[propertyName].split(/,\s*| or /).forEach(val => values.add(val.trim().toLowerCase()));
                    } else {
                        values.add(String(item[propertyName]).toLowerCase());
                    }
                }
            });
            const sortedValues = Array.from(values).sort();
            return sortedValues;
        },

        setEntityData: function(newData) {
            _entityData = newData; 
            this._notifyContext(); 
        },

        getFilterTitle: function() {
            const titles = [];
            if (_activeFilter.school) {
                titles.push(_activeFilter.school.charAt(0).toUpperCase() + _activeFilter.school.slice(1) + ' School');
            }
            if (_activeFilter.class) {
                titles.push(_activeFilter.class.charAt(0).toUpperCase() + _activeFilter.class.slice(1) + ' Spells');
            }
            if (_activeFilter[_tabProperty] !== undefined && _activeFilter[_tabProperty] !== '') {
                titles.push('Level ' + _activeFilter[_tabProperty]);
            }
            if (_activeFilter.rarity) {
                titles.push(_activeFilter.rarity.charAt(0).toUpperCase() + _activeFilter.rarity.slice(1) + ' Rarity');
            }
            if (_activeFilter.type) {
                titles.push(_activeFilter.type.charAt(0).toUpperCase() + _activeFilter.type.slice(1));
            }
            const title = titles.join(' & ');
            return title;
        },
    };

    return manager;
};