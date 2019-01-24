(function ($, window) {
    var $selector;
    var grade = ['province', 'city', 'district', 'street'];
    var defaults = {
        dataJson: null,
        selectpattern: [{
            field: 'userProvinceId',
            placeholder: '请选择省份'
        }, {
            field: 'userCityId',
            placeholder: '请选择城市'
        }, {
            field: 'userDistrictId',
            placeholder: '请选择区县'
        }, {
            field: 'userStreet',
            placeholder: '请选择街道'
        }],
        shorthand: false,
        storage: true,
        autoSelected: true,
        renderMode: true,
        keyboard: false,
        code: false,
        search: true,
        searchNotStr: '查找不到{city}相关城市~',
        streetUrl: 'https://lquan529.github.io/cityPicker/{json}.json',
        level: 3,
        onInitialized: function () {},
        onClickBefore: function () {},
        onChoiceEnd: function () {},
        onForbid: function () {}
    };

    function Citypicker(options, selector) {
        this.options = $.extend({}, defaults, options);
        this.$selector = $selector = $(selector);
        this.values = [];
        this.init();
        this.bindEvent();
    }
    var effect = {
        montage: function (data, pid, reg) {
            var self = this,
                config = self.options,
                leng = data.length,
                html = '',
                code, name, storage;
            for (var i = 0; i < leng; i++) {
                if (data[i].parentId === pid) {
                    code = config.code && data[i].cityCode !== '' ? 'data-code=' + data[i].cityCode : '';
                    name = config.shorthand ? data[i].shortName : data[i].name;
                    storage = config.storage ? data[i].id : name;
                    if (config.renderMode) {
                        html += '<li class="caller" data-id="' + data[i].id + '" data-title="' + name +
                            '" ' + code + '>' + name + '</li>';
                    } else {
                        html += '<option class="caller" value="' + storage + '" data-id="' + data[i].id +
                            '" data-title="' + name + '" ' + code + '>' + name + '</option>';
                    }
                }
            }
            return html;
        },
        seTemplet: function () {
            var config = this.options,
                selectemplet = '',
                placeholder, field, forbid, citygrade, active, hide, searchStr = config.search ?
                '<div class="selector-search">' +
                '<input type="text" class="input-search" value="" placeholder="拼音、中文搜索" />' +
                '</div>' : '';
            for (var i = 0; i < config.level; i++) {
                placeholder = config.selectpattern[i].placeholder;
                field = config.selectpattern[i].field;
                citygrade = grade[i];
                forbid = i > 0 ? 'forbid' : '';
                active = i < 1 ? 'active' : '';
                hide = i > 0 ? ' hide' : '';
                if (config.renderMode) {
                    selectemplet += '<div class="selector-item storey ' + citygrade + '" data-index="' + i +
                        '">' +
                        '<a href="javascript:;" class="selector-name reveal df-color ' + forbid + '">' +
                        placeholder + '</a>' +
                        '<input type=hidden name="' + field +
                        '" class="input-price val-error" value="" data-required="' + field + '">' +
                        '<div class="selector-list listing">' + searchStr + '<ul></ul></div>' +
                        '</div>';
                } else {
                    selectemplet += '<select name="' + field + '" data-index="' + i + '" class="' +
                        citygrade + '">' +
                        '<option>' + placeholder + '</option>' +
                        '</select>';
                }
            }
            return selectemplet;
        },
        obtain: function (event) {
            var self = this,
                config = self.options,
                $selector = self.$selector,
                $target = config.renderMode ? event[0].target ? $(event[0].target) : $(event) : $(event.target),
                $parent = $target.parents('.listing'),
                $selected = $target.find('.caller:selected'),
                index = config.renderMode ? $target.parents('.storey').data('index') : $target.data('index'),
                id = config.renderMode ? $target.attr('data-id') : $selected.attr('data-id'),
                name = config.renderMode ? $target.text() : $selected.text(),
                storage = config.storage ? id : name,
                code = config.renderMode ? $target.data('code') : $selected.data('code'),
                $storey = $selector.find('.storey[data-index="' + index + '"]'),
                $listing = $selector.find('.listing').eq(index + 1),
                values = {
                    'id': id || '0',
                    'name': name,
                    'cityCode': code || ''
                },
                aselectedIndex = config.autoSelected ? 1 : 0,
                placeholder = config.selectpattern[index < 3 ? index + 1 : index].placeholder,
                placeholderStr = !config.renderMode ? '<option class="caller" value="">' + placeholder +
                '</option>' + effect.montage.apply(self, [config.dataJson, id]) : '<li class="caller">' +
                placeholder + '</li>' + effect.montage.apply(self, [config.dataJson, id]);
            if (self.values.length > 0) {
                self.values.splice(index, config.level - 1, values);
            } else {
                self.values.push(values);
            }
            $selector.trigger('choose-' + grade[index] + '.citypicker', [$target, values]);
            $selector.find('[role="code"]').val(code);
            self.cityCode = code;
            if (config.renderMode) {
                $storey.find('.reveal').removeClass('df-color forbid').text(name).siblings('.input-price').val(
                    storage);
                $listing.data('id', id).find('ul').html(placeholderStr);
                index < 2 ? $listing.find('.caller').eq(aselectedIndex).trigger('click') : '';
                $listing.find('.caller').eq(0).remove();
                !config.autoSelected ? $selector.find('.reveal').eq(index + 1).addClass('df-color') : '';
                $parent.find('.caller').removeClass('active');
                $target.addClass('active');
            } else {
                $target.next().html(placeholderStr).find('.caller').eq(aselectedIndex).prop('selected',
                    true);
                index < 2 ? $target.next().trigger('change') : '';
            }
            if (config.level === 4 && index === 2) {
                self.getStreet(id);
            }
            if (config.level - 1 === index) {
                config.onChoiceEnd.apply(self);
            }
        },
        show: function (event) {
            var config = this.options,
                $target = $(event),
                $parent = $target.parent();
            $selector = this.$selector;
            $parent.addClass('selector-show').siblings('.selector-item').removeClass('selector-show');
            if (config.search) {
                setTimeout(function () {
                    $parent.find('.input-search').focus();
                }, 400);
            }
            config.onClickBefore.call($target);
        },
        hide: function (event) {
            var config = this.options,
                $target = $(event);
            effect.obtain.call(this, $target);
            $selector.find('.selector-item').removeClass('selector-show');
            return false;
        },
        search: function (event) {
            event.preventDefault();
            var self = this,
                $target = $(event.target),
                $parent = $target.parents('.listing'),
                inputVal = $target.val(),
                id = $parent.data('id'),
                keycode = event.keyCode,
                result = [],
                htmls;
            if (keycode === 16 || keycode === 17 || keycode === 18 || keycode === 37 || keycode === 39 ||
                keycode === 91 || keycode === 93) {
                return false;
            }
            if (keycode !== 13 && keycode !== 38 && keycode !== 40) {
                $.each(this.options.dataJson, function (key, value) {
                    if (value.pinyin.toLocaleLowerCase().search(inputVal) > -1 || value.name.search(
                            inputVal) > -1 || value.id.search(inputVal) > -1) {
                        result.push(value);
                    }
                });
                htmls = effect.montage.apply(self, [result, id]);
                $parent.find('ul').html(htmls ? htmls : '<li>' + self.options.searchNotStr.replace('{city}',
                    '<strong>' + inputVal + '</strong>') + '</li>');
            }
        },
        operation: function (event) {
            event.preventDefault();
            var $target = $(event.target),
                $sibl = $target.hasClass('input-search') ? $target.parents('.listing') : $target.siblings(
                    '.listing'),
                $items = $sibl.find('.caller'),
                inputVal = $sibl.find('.input-search').val(),
                keyCode = event.keyCode,
                index = 0,
                direction, itemIndex;
            if (keyCode === 13) {
                if (!$items.hasClass('active')) {
                    return false;
                }
                effect.hide.call(this, $sibl.find('.caller.active'));
                return false;
            }
            if (keyCode === 38 || keyCode === 40) {
                direction = keyCode === 38 ? -1 : 1;
                itemIndex = $items.index($sibl.find('.caller.active'));
                if (itemIndex < 0) {
                    index = direction > 0 ? -1 : 0;
                } else {
                    index = itemIndex;
                }
                index = index + direction;
                index = index === $items.length ? 0 : index;
                $items.removeClass('active').eq(index).addClass('active');
                effect.position.call(this, $sibl);
            }
            return false;
        },
        position: function (event) {
            var $target = event,
                $caller = $target.find('.caller.active'),
                oh = $target.outerHeight(),
                ch = $caller.outerHeight(),
                dy = $caller.position().top,
                sy = $target.find('ul').scrollTop();
            $target.find('ul').animate({
                scrollTop: dy + ch - oh + sy
            }, 200);
        },
        evaluation: function (arr, arrayVal) {
            var self = this,
                config = self.options,
                $selector = self.$selector;
            self.values = [];
            $.each(arr, function (item, value) {
                var $original = $selector.find('.' + grade[item]);
                var $forward = $selector.find('.' + grade[item + 1]);
                var name = config.shorthand ? value.shortName : value.name;
                var inputVal = config.storage ? value.id : name;
                if (config.renderMode) {
                    $original.find('.reveal').text(name).removeClass('df-color forbid').siblings(
                        '.input-price').val(inputVal);
                    $forward.find('ul').html(effect.montage.apply(self, [config.dataJson, value.id]));
                    $original.find('.caller[data-id="' + value.id + '"]').addClass('active');
                } else {
                    $forward.html(effect.montage.apply(self, [config.dataJson, value.id]));
                    $original.find('.caller[data-id="' + value.id + '"]').prop('selected', true);
                }
                self.values.push({
                    'id': value.id,
                    'name': name,
                    'cityCode': value.cityCode
                });
            });
            if (arr.length === 3 && config.level === 4) {
                self.getStreet(arr[2].id, true, arrayVal[3] ? arrayVal[3] : '');
            }
        }
    };
    Citypicker.prototype = {
        init: function () {
            var self = this,
                config = self.options,
                code = config.code ? '<input type="hidden" role="code" name="' + config.code +
                '" value="">' : '';
            $selector.html(effect.seTemplet.call(self) + code);
            if (config.renderMode) {
                $selector.find('.listing').data('id', '100000').eq(0).find('ul').html(effect.montage.apply(
                    self, [config.dataJson, '100000']));
            } else {
                $selector.find('.province').append(effect.montage.apply(self, [config.dataJson, '100000']));
            }
            config.onInitialized.call(self);
        },
        bindEvent: function () {
            var self = this,
                config = self.options;
            $selector.on('click.citypicker', '.reveal', function (event) {
                event.preventDefault();
                var $this = $(this);
                if ($this.is('.forbid, .disabled')) {
                    config.onForbid.call($this);
                    return false;
                }
                effect.show.call(self, $this);
                return false;
            });
            $selector.on('click.citypicker', '.caller', $.proxy(effect.hide, self));
            $selector.on('change.citypicker', 'select', $.proxy(effect.obtain, self));
            $selector.on('keyup.citypicker', '.input-search', $.proxy(effect.search, self));
            if (config.keyboard) {
                $selector.on('keyup.citypicker', '.storey', $.proxy(effect.operation, self));
            }
        },
        unBindEvent: function (event) {
            var self = this,
                config = self.options;
            if (!config.renderMode) {
                $selector.off('change.citypicker', 'select');
                return false;
            }
            $selector.off('click.citypicker', '.reveal');
            $selector.off('click.citypicker', '.caller');
            $selector.off('keyup.citypicker', '.input-search');
            $selector.off('keyup.citypicker', '.storey');
        },
        setCityVal: function (val) {
            var self = this,
                arrayVal = val.split(/\,\s|\,/g),
                result = [],
                resultArray;
            $.each(arrayVal, function (key, value) {
                $.each(self.options.dataJson, function (item, val) {
                    var isType = isNaN(value) ? value === val.name : value === val.id;
                    if (isType) {
                        result.push(val);
                    }
                });
            });
            resultArray = result[0].parentId === '100000' ? result.sort() : result.reverse();
            effect.evaluation.apply(self, [result, arrayVal]);
        },
        getCityVal: function () {
            return this.values;
        },
        changeStatus: function (status) {
            var self = this,
                config = self.options;
            if (status === 'disabled') {
                self.$selector.find('.reveal').addClass('disabled').siblings('.input-price').prop(
                    'disabled', true);
                !config.renderMode ? self.$selector.find('select').prop('disabled', true) : '';
            } else if (status === 'current') {
                self.$selector.find('.reveal').removeClass('disabled forbid').siblings('.input-price').prop(
                    'disabled', false);
                !config.renderMode ? self.$selector.find('select').prop('disabled', false) : '';
            }
        },
        getStreet: function (id, isSet, name) {
            var self = this,
                config = self.options,
                $street = self.$selector.find('.street'),
                placeholder = config.selectpattern[3].placeholder,
                index = config.autoSelected ? 1 : 0,
                title = name && config.shorthand ? name.replace(/街道|镇|乡/g, '') : name,
                converts = isNaN(title) ? 'data-title=' + title : config.renderMode ? 'data-id=' + title :
                'value="' + title + '"',
                reults = [],
                placeholderStr, autoSelectedStr;
            if (!id) {
                return false;
            }
            $.getJSON(config.streetUrl.replace('{json}', id), function (data) {
                $.each(data, function (key, value) {
                    reults.push({
                        'id': key,
                        'parentId': id,
                        'name': value,
                        'shortName': value.replace(/街道|镇|乡/g, ''),
                        'cityCode': ''
                    });
                });
                placeholderStr = !config.renderMode ? '<option class="caller" value="">' +
                    placeholder + '</option>' + effect.montage.apply(self, [reults, id]) :
                    '<li class="caller">' + placeholder + '</li>' + effect.montage.apply(self, [
                        reults, id]);
                if (config.renderMode) {
                    $street.find('ul').html(placeholderStr);
                    if (isSet) {
                        $street.find('.caller[' + converts + ']').trigger('click');
                    } else {
                        $street.find('.caller').eq(index).trigger('click');
                    }
                    $street.find('.caller').eq(0).remove();
                    !isSet & !config.autoSelected ? $street.find('.reveal').addClass('df-color') :
                        '';
                } else {
                    $street.html(placeholderStr);
                    if (isSet) {
                        $street.find('.caller[' + converts + ']').prop('selected', true);
                    } else {
                        $street.find('.caller').eq(index).prop('selected', true);
                    }
                    $street.trigger('change');
                }
            });
        }
    };
    $(document).on('click.citypicker', function (event) {
        if ($selector && $selector.find(event.target).length < 1) {
            $selector.find('.selector-item').removeClass('selector-show');
        }
    });
    $.fn.cityPicker = function (options) {
        return new Citypicker(options, this);
    };
})(jQuery, window);