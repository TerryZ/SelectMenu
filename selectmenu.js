/**
 * @summary     SelectMenu
 * @desc        基于jQuery的下拉菜单选择器
 * @file        selectmenu.js
 * @version     1.0
 * @author      TerryZeng
 * @contact     https://terryz.github.io/
 * @license     MIT License
 *
 * depend on：
 * jQuery1.x
 *
 * Changelog：
 */
;(function($){
	"use strict";
	/**
	 * 默认参数集
	 */
	var defaults = {
		/**
		 * 数据源(json格式数据源或function处理后返回的数据源)
		 * @type {array | function}
		 * @example
		 * string：服务端请求的URL地址
		 * Object：JSON格式数组，推荐格式：[{a:1,b:2,c:3},{...}]
		 */
		data: undefined,
        /**
         * 是否显示快速搜索输入框，默认显示
         * 仅在高级模式下可用
         * @type boolean
         */
        search : true,
        /**
         * 标题栏文本
         * @type string 默认 'SelectMenu'
         */
        title : 'SelectMenu',
        /**
         * 常规菜单模式
         * @type boolean 默认 false
         */
        regular : false,
        /**
         * 鼠标右键触发模式
         * @type boolean 默认 false
         */
        rightClick : false,
        /**
         * 在弹出式菜单的模式下（非嵌入式），是否显示箭头
         * @type boolean 默认 false
         */
        arrow : false,
        /**
         * 菜单对齐方向
         * @type string 默认 'left'
         * @enum
         * 'left'
         * 'center'
         * 'right'
         */
        position : 'left',
        /**
         * 嵌入到页面中，非弹出模式
         * @type boolean 默认 false
         */
        embed : false,
		/**
		 * 插件显示语言 ('ja', 'en', 'es', 'pt-br'等)
		 * @type string 默认'cn'
		 */
		lang: 'cn',
		/**
		 * 是否为多选模式（标签模式）
		 * @type boolean 默认值false
		 */
		multiple: false,
        /**
         * 列表显示的项目个数，其它的项目以滚动条滚动方式展现
         * @type number 默认值 10
         */
        listSize : 10,
		/**
		 * 多选模式下最大选择个数，0为不限制
		 * @type number 默认0
		 */
		maxSelectLimit: 0,
		/**
		 * 选中项目后关闭列表
		 * 该设置仅在多选模式下multiple:true有效
		 * @type boolean 默认值true
		 */
		selectToCloseList: false,
		/**
		 * 插件初始值指定，该值会与option.keyField字段进行匹配，若匹配到，则自动设置选中并高亮
		 * @type string 
		 */
		initSelected: undefined,
		/**
		 * 值字段，通常该字段的内容会自动保存在隐藏域中
		 * @type string 默认值为'id'
		 */
		keyField: 'id',
		/**
		 * 结果集中用于显示的属性名
		 * @type string 默认字段为'name'
		 */
		showField: 'name',
		/**
		 * 查询字段，不设置则默认使用showField设置的字段
		 * @type string
		 */
		searchField : undefined,
		/**
		 * 查询方式 ('AND' or 'OR')
		 * @type string 默认为'AND'
		 */
		andOr: 'AND',
        /**
         * 数据排序方式
         * @type array 若不设置则默认对showField指定的字段进行排序
         * @example
         * orderBy : ['id desc']//对ID字段进行降序排序
         */
        orderBy: undefined,
		/**
		 * 最大显示的项目个数
		 * @type number
		 */
		pageSize: 100,
		/**
		 * 列表项目显示内容格式化
		 * @type function
		 * @param data {object} 行数据object格式
		 * @return string
		 */
		formatItem : undefined,
		/**
		 * -----------------------------------------事件回调--------------------------------------------
		 */
		/**
		 * @type function
		 * @param object
		 * @param dom
		 */
		eSelect : undefined
	};


	/**
	 * @constructor
	 * 插件初始化
	 * @param {Object} input - 插件的初始化输入框元素。
	 * @param {Object} option - 初始化参数
	 */
	var SelectMenu = function(input, option) {
	    this.target = input;
		this.setOption(option);
		if(this.option.embed && !$(input).is('div')){
		    console.warn('SelectMenu embed mode need a div container element!');
		    return;
        }

		this.setLanguage();
		this.setCssClass();
		this.setProp();

        if(option.regular) this.setRegularMenu();
        else this.setElem();

        if(!option.rightClick) this.populate();

        this.eInput();
        if(!option.embed) this.eWhole();
		this.atLast();
	};
	SelectMenu.version = '1.0';
	/**
	 * 插件缓存内部对象的KEY
	 */
	SelectMenu.dataKey = 'selectMenuObject';
	/**
	 * 全局范围设置当前点击是否为插件自身的标识
	 */
	SelectMenu.objStatusKey = 'selectMenu-self-mark';
	/**
	 * 全局范围设置当前点击的selectmenu的索引下标
	 */
	SelectMenu.objStatusIndex = 'selectMenu-self-index';

    /**
     * 数据源格式
     * 列表模式
     * @type {string}
     */
	SelectMenu.dataTypeList = 'SelectMenuList';
    /**
     * 分组类型
     * @type {string}
     */
    SelectMenu.dataTypeGroup = 'SelectMenuGroup';
    /**
     * 普通菜单类型
     * @type {string}
     */
    SelectMenu.dataTypeMenu = 'SelectMenuMenu';
	/**
	 * 参数初始化
	 * @param {Object} option - 参数集
	 */
	SelectMenu.prototype.setOption = function(option) {
		//若没有设置搜索字段，则使用显示字段作为搜索字段
		option.searchField = (option.searchField === undefined) ? option.showField: option.searchField;

		if(option.regular && option.title === defaults.title) option.title = false;
		//嵌入模式或鼠标右键模式中，强制关闭菜单箭头
		if(option.embed || option.richCombo) option.arrow = false;

		//统一大写
		option.andOr = option.andOr.toUpperCase();
		if(option.andOr!=='AND' && option.andOr!=='OR') option.andOr = 'AND';

		//将参数内容从使用","分隔的字符串转换为数组
		var arr = ['searchField'];
		for (var i = 0; i < arr.length; i++) {
			option[arr[i]] = this.strToArray(option[arr[i]]);
		}

		//设置排序字段
		option.orderBy = (option.orderBy === undefined) ? option.searchField: option.orderBy;

		//设置多字段排序
		//例:  [ ['id', 'ASC'], ['name', 'DESC'] ]
		option.orderBy = this.setOrderbyOption(option.orderBy, option.showField);

		if($.type(option.data) === 'string'){
		    option.autoSelectFirst = false;
        }
		if($.type(option.listSize) !== 'number' || option.listSize < 0) option.listSize = 12;

		this.option = option;
	};

	/**
	 * 字符串转换为数组
	 * @param str {string} - 字符串
	 * @return {Array} - 数组
	 */
	SelectMenu.prototype.strToArray = function(str) {
		if(!str) return '';
		return str.replace(/[\s　]+/g, '').split(',');
	};

	/**
	 * 设置多字段排序
	 * @param {Array} arg_order - 排序顺序
	 * @param {string} arg_field - 字段
	 * @return {Array} - 处理后的排序字段内容
	 */
	SelectMenu.prototype.setOrderbyOption = function(arg_order, arg_field) {
		var arr = [],orders = [];
		if (typeof arg_order == 'object') {
			for (var i = 0; i < arg_order.length; i++) {
				orders = $.trim(arg_order[i]).split(' ');
				arr[i] = (orders.length == 2) ? orders: [orders[0], 'ASC'];
			}
		} else {
			orders = $.trim(arg_order).split(' ');
			arr[0] = (orders.length == 2) ? orders: (orders[0].match(/^(ASC|DESC)$/i)) ? [arg_field, orders[0]] : [orders[0], 'ASC'];
		}
		return arr;
	};

	/**
	 * 界面文字国际化
	 */
	SelectMenu.prototype.setLanguage = function() {
		var message;
		switch (this.option.lang) {
            // 中文
            case 'cn':
                message = {
                    select_all_btn: '选择所有 (或当前页签) 项目',
                    remove_all_btn: '清除所有选中的项目',
                    close_btn: '关闭菜单 (Esc键)',
                    loading: '读取中...',
                    select_ng: '请注意：请从列表中选择.',
                    select_ok: 'OK : 已经选择.',
                    not_found: '无查询结果',
                    ajax_error: '连接到服务器时发生错误！'
                };
                break;
            // English
            case 'en':
                message = {
                    select_all_btn: 'Select All (Tabs) items',
                    remove_all_btn: 'Clear all selected items',
                    close_btn: 'Close Menu (Esc key)',
                    loading: 'loading...',
                    select_ng: 'Attention : Please choose from among the list.',
                    select_ok: 'OK : Correctly selected.',
                    not_found: 'not found',
                    ajax_error: 'An error occurred while connecting to server.'
                };
                break;
            // Japanese
            case 'ja':
                message = {
                    select_all_btn: 'すべての （または現在のタブ） 項目を選択',
                    remove_all_btn: '選択したすべての項目をクリアする',
                    close_btn: '閉じる (Tabキー)',
                    loading: '読み込み中...',
                    select_ng: '注意 : リストの中から選択してください',
                    select_ok: 'OK : 正しく選択されました。',
                    not_found: '(0 件)',
                    ajax_error: 'サーバとの通信でエラーが発生しました。'
                };
                break;
            // German
            case 'de':
                message = {
                    select_all_btn: 'Wählen Sie alle (oder aktuellen Registerkarten) aus',
                    remove_all_btn: 'Alle ausgewählten Elemente löschen',
                    close_btn: 'Schließen (Tab)',
                    loading: 'lade...',
                    select_ng: 'Achtung: Bitte wählen Sie aus der Liste aus.',
                    select_ok: 'OK : Richtig ausgewählt.',
                    not_found: 'nicht gefunden',
                    ajax_error: 'Bei der Verbindung zum Server ist ein Fehler aufgetreten.'
                };
                break;
            // Spanish
            case 'es':
                message = {
                    select_all_btn: 'Seleccionar todos los elementos (o la pestaña actual)',
                    remove_all_btn: 'Borrar todos los elementos seleccionados',
                    close_btn: 'Cerrar (tecla TAB)',
                    loading: 'Cargando...',
                    select_ng: 'Atencion: Elija una opcion de la lista.',
                    select_ok: 'OK: Correctamente seleccionado.',
                    not_found: 'no encuentre',
                    ajax_error: 'Un error ocurrió mientras conectando al servidor.'
                };
                break;
            // Brazilian Portuguese
            case 'pt-br':
                message = {
                    select_all_btn: 'Selecione todos os itens (ou guia atual)',
                    remove_all_btn: 'Limpe todos os itens selecionados',
                    close_btn: 'Fechar (tecla TAB)',
                    loading: 'Carregando...',
                    select_ng: 'Atenção: Escolha uma opção da lista.',
                    select_ok: 'OK: Selecionado Corretamente.',
                    not_found: 'não encontrado',
                    ajax_error: 'Um erro aconteceu enquanto conectando a servidor.'
                };
                break;
		}
		this.message = message;
	};

	/**
	 * CSS样式表名称字义
	 */
	SelectMenu.prototype.setCssClass = function() {
		var css_class = {
		    target_clicked : 'sm_target_clicked',
			container: 'sm_container',
			// SelectMenu最外层DIV的打开状态
			container_open: 'sm_container_open',
            container_embed: 'sm_embed',
            header: 'sm_header',
			re_area: 'sm_result_area',
            re_tabs: 'sm_result_tabs',
            re_list: 'sm_list_mode',
			control_box: 'sm_control_box',
            two_btn: 'sm_two_btn',
			//标签及输入框的
			element_box: 'sm_element_box',
			// 下拉结果列表
			results: 'sm_results',
			re_off: 'sm_results_off',
			select: 'sm_over',
            selected_icon: 'sm_selected_icon',
            item_text: 'sm_item_text',
			select_ok: 'sm_select_ok',
			select_ng: 'sm_select_ng',
            selected: 'sm_selected',
			input_off: 'sm_input_off',
			message_box: 'sm_message_box',

			btn_close: 'sm_close_button',
            btn_selectall : 'sm_selectall_button',
            btn_removeall : 'sm_removeall_button',
			btn_on: 'sm_btn_on',
			btn_out: 'sm_btn_out',
			input: 'sm_input',
            input_area: 'sm_input_area',
            clear_btn : 'sm_clear_btn',
            menu_divider : 'sm_divider',
            menu_regular : 'sm_regular',
            menu_arrow : 'sm_arrow',
            menu_arraw_have_title : 'sm_have_title',
            menu_disabled : 'sm_disabled',
            menu_header : 'sm_header',
            direction_top : 'sm_arrow_top',
            direction_bottom : 'sm_arrow_bottom'
		};
		this.css_class = css_class;
	};

	/**
	 * 插件内部属性设置默认值
	 */
	SelectMenu.prototype.setProp = function() {
		this.prop = {
		    //插件选中的值
		    values : [],
            //数据展示的数据对象
            data : undefined,
            //多分组数据的当前分组的下标
            data_index : 0,
			//当前页
			current_page: 1,
			//总页数
			max_page: 1,
			//使用键盘进行选择
			key_select: false,
			//上一个选择的项目值
			prev_value: '',
            //选中项目的文本内容
            selected_text : '',
			//上一次键盘输入的时间
			last_input_time: undefined,
            //数据类型
            data_type : SelectMenu.dataTypeList,
            //id前缀
            menu_tab_id_prefix : 'selectmenu_tab_',
            //mouse x point
            x : undefined,
            //mouse y point
            y : undefined
		};
	};

    /**
     * 数据源格式检查
     */
    SelectMenu.prototype.checkDataType = function(d){
        var self = this,p = this.option;
        if(d && $.isArray(d) && d.length){
            if(p.regular) return SelectMenu.dataTypeMenu;
            else{
                var row = d[0];
                if(row.hasOwnProperty('title') && row.hasOwnProperty('list') && $.isArray(row.list)){
                    return SelectMenu.dataTypeGroup;
                }else return SelectMenu.dataTypeList;
            }
        }else return null;
    };

	/**
	 * 插件HTML结构生成
	 */
	SelectMenu.prototype.setElem = function() {
	    var self = this,p = this.option;
		// 1. 生成、替换DOM对象
		var elem = {};//本体

        elem.container = p.embed ? $(self.target).addClass(this.css_class.container_embed) : $('<div>');
        $(elem.container).addClass(this.css_class.container).addClass(this.css_class.direction_bottom);
        if(p.title){
            elem.header = $('<div>').addClass(this.css_class.header);
            $(elem.header).append('<h3>' + p.title + '</h3>');
            if(p.multiple){
                elem.selectAllButton = $('<button type="button"><i class="iconfont icon-selectall"></i></button>')
                    .attr('title',this.message.select_all_btn)
                    .addClass(this.css_class.btn_selectall);
                elem.removeAllButton = $('<button type="button"><i class="iconfont icon-removeall"></i></button>')
                    .attr('title',this.message.remove_all_btn)
                    .addClass(this.css_class.btn_removeall);
                $(elem.header).append(elem.selectAllButton);
                $(elem.header).append(elem.removeAllButton);
            }

            if(!p.embed){
                elem.closeButton = $('<button type="button">×</button>')
                    .attr('title',self.message.close_btn)
                    .addClass(this.css_class.btn_close);
                $(elem.header).append(elem.closeButton);
            }
        }

        elem.inputArea = $('<div>').addClass(this.css_class.input_area);
		elem.input = $('<input type="text" autocomplete="off">').addClass(this.css_class.input);

		//单选模式下清除的按钮X
		//elem.clear_btn = $('<div>').append('×').addClass(this.css_class.clear_btn).attr('title','清除内容');

		//结果集列表
		elem.resultArea = $('<div>').addClass(this.css_class.re_area);
        elem.resultTabs = $('<div>').addClass(this.css_class.re_tabs);
		elem.results = $('<ul>').addClass(this.css_class.results);
        elem.selectedIcon = $('<i class="iconfont icon-selected">');


		// 2. DOM内容放置
        if(p.arrow){
            elem.arrow = $('<div>').addClass(this.css_class.menu_arrow);
            if(p.title) $(elem.arrow).addClass(this.css_class.menu_arraw_have_title);
            $(elem.container).append(elem.arrow);
        }
        if(p.title)
            $(elem.container).append(elem.header)
        if(p.search){
            $(elem.container).append(elem.inputArea);
            $(elem.inputArea).append(elem.input);
        }
        $(elem.container).append(elem.resultTabs);
        $(elem.container).append(elem.resultArea);
		$(elem.resultArea).append(elem.results);

		if(!p.embed) $(document.body).append(elem.container);

		this.elem = elem;
	};

    /**
     * 初始化常规下拉菜单
     */
	SelectMenu.prototype.setRegularMenu = function(){
	    var p = this.option,self = this;
	    var elem = {};
        elem.container = p.embed ? $(self.target).addClass(this.css_class.container_embed) : $('<div>');
        $(elem.container).addClass(this.css_class.container)
            .addClass(this.css_class.direction_bottom)
            .addClass(this.css_class.menu_regular);
        if(p.title){
            elem.header = $('<div>').addClass(this.css_class.header);
            $(elem.header).append('<h3>' + p.title + '</h3>');
            if(!p.embed)
                elem.closeButton = $('<button type="button">×</button>')
                .attr('title',self.message.close_btn)
                .addClass(this.css_class.btn_close);
        }


        //结果集列表
        elem.resultArea = $('<div>').addClass(this.css_class.re_area);
        elem.results = $('<ul>').addClass(this.css_class.results);

        if(p.arrow){
            elem.arrow = $('<div>').addClass(this.css_class.menu_arrow);
            if(p.title) $(elem.arrow).addClass(this.css_class.menu_arraw_have_title);
            $(elem.container).append(elem.arrow);
        }

        if(p.title){
            $(elem.container).append(elem.header);
            if(!p.embed) $(elem.header).append(elem.closeButton);
        }
        $(elem.container).append(elem.resultArea);
        $(elem.resultArea).append(elem.results);

        if(!p.embed) $(document.body).append(elem.container);
        this.elem = elem;
    };

    /**
     * 常规类型菜单数据初始化
     */
    SelectMenu.prototype.regularMenuInit = function(){
        var d = this.prop.data, p = this.option, self = this;
        if(d && $.isArray(d) && d.length > 0){
            $(self.elem.results).empty().hide();
            $.each(d,function(i,row){
                var li = $('<li>');
                if(row.content === 'sm_divider'){
                    $(li).addClass(self.css_class.menu_divider);
                }else{
                    if(row.header){
                        $(li).html($('<a href="javascript:void(0);">').html(row.content)).addClass(self.css_class.menu_header);
                    }else{
                        if(row.url){
                            var a = $('<a>').html(row.content);
                            if(row.disabled) $(a).attr('href','javascript:void(0);');
                            else $(a).attr('href',row.url);
                            $(li).html(a);
                        }else if(row.callback && $.isFunction(row.callback)){
                            var a = $('<a href="javascript:void(0);">').html(row.content).on('click.selectMenu',function(e){
                                e.stopPropagation();
                                if(row.disabled) return;
                                row.callback();
                                self.hideResults(self);
                            });
                            $(li).html(a);
                        }
                        if(row.disabled) $(li).addClass(self.css_class.menu_disabled);
                    }
                }
                $(self.elem.results).append(li);
            });
            $(self.elem.results).show();
            if(!p.embed){
                //显示结果集列表并调整位置
                this.calcResultsSize(this);
                $(self.elem.container).addClass(self.css_class.container_open);
            }
        }
    };

    /**
     * 显示菜单
     * @param self
     */
    SelectMenu.prototype.showMenu = function(self){
        self.populate();
        if($(self.target).is('button'))
            $(self.target).addClass(self.css_class.target_clicked);
    };

    /**
     * 设置初始化选中项目
     * @param self  插件内部对象
     * @param list  当前列表数据
     */
    SelectMenu.prototype.setInitSelected = function(self, list){
        var p = self.option;
        if($.type(p.initSelected) !== 'undefined' &&
            !p.regular && list && $.isArray(list) && list.length > 0){
            var str = String(p.initSelected);
            var arr = str.split(',');
            $.each(list, function(i,row){
                var id = String(row[p.keyField]);
                if(id && $.inArray(id,arr) !== -1) self.prop.values.push(row);
            });
            p.initSelected = undefined;
        }
    };

	/**
	 * 输入框的事件绑定
	 */
	SelectMenu.prototype.eInput = function() {
		var self = this,p = this.option,el = self.elem;
		if(!p.regular && p.search){
            $(el.input).keyup(function(e) {
                self.processKey(self, e);
            }).keydown(function(e){
                self.processControl(self, e);
            })
        }
        if(p.title){
            $(el.closeButton).click(function(e){
                self.hideResults(self);
            });
            if(!p.regular){
                $(el.header).not('button').click(function(e){
                    $(el.input).focus();
                });
                $(el.inputArea).not(el.input).click(function(e){
                    $(el.input).focus();
                });
                if(p.multiple){
                    $(el.selectAllButton).click(function(e){
                        e.stopPropagation();
                        self.selectAllLine(self);
                    });
                    $(el.removeAllButton).click(function(e){
                        e.stopPropagation();
                        self.clearAll(self);
                    });
                }
            }
        }
        if(!p.regular && self.prop.data_type === SelectMenu.dataTypeGroup){
            $(el.resultTabs).on('click.selectMenu', 'a', function(e){
                e.stopPropagation();
                if(!$(this).hasClass('active')){
                    var li = $(this).closest('li');
                    $(li).siblings().children('a').removeClass('active');
                    $(this).addClass('active');
                    self.prop.data_index = parseInt($(this).attr('data_index'));
                    self.populate();
                }
            });
        }
        if(p.rightClick){
            $(self.target).on('contextmenu',function(e){
                e.preventDefault();
                e.stopPropagation();
                e.cancelBubble = true;
                e.returnValue = false;
                var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
                var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
                self.prop.x = e.pageX || e.clientX + scrollX;
                self.prop.y = e.pageY || e.clientY + scrollY;
                if(!self.isVisible(self)) self.populate();
                else self.calcResultsSize(self);
                return false;
            }).mouseup(function(e){
                if(e.button != 2) self.hideResults(self);
            });
            self.hideResults(self);
        }
	};

	/**
	 * 插件整体的事件处理
	 */
	SelectMenu.prototype.eWhole = function() {
		var self = this;
		//控件外部的鼠标点击事件处理
		$(document).off('mouseup.selectMenu').on('mouseup.selectMenu',function(e) {
		    var srcEl = e.target || e.srcElement;
		    var sm = $(srcEl).closest('div.' + self.css_class.container);
            //列表是打开的状态
            $('div.' + self.css_class.container + '.' + self.css_class.container_open).each(function(){
                var d = $(this).data(SelectMenu.dataKey);
                if(this == sm[0] || d.target == srcEl || $(srcEl).closest(d.target).size() > 0) return;
                d.hideResults(d);
            });
		});
	};

	/**
	 * 结果列表的事件处理
	 */
	SelectMenu.prototype.eResultList = function() {
		var self = this;
		$(self.elem.results).children('li').mouseenter(function() {
			if (self.prop.key_select) {
				self.prop.key_select = false;
				return;
			}
			if(!$(this).hasClass('sm_message_box')) $(this).addClass(self.css_class.select);
		}).mouseleave(function(){
		    $(this).removeClass(self.css_class.select);
        }).click(function(e) {
			if (self.prop.key_select) {
				self.prop.key_select = false;
				return;
			}
			e.preventDefault();
			e.stopPropagation();

            self.selectCurrentLine(self, false);
		});
	};

    /**
     * 最后的一些处理工作
     */
    SelectMenu.prototype.atLast = function(){
        var self = this,p = this.option;
        if(p.search && !p.embed && !p.rightClick) $(self.elem.input).focus();
        $(self.elem.container).data(SelectMenu.dataKey,self);
        if($(self.target).is('button,.btn') && !p.embed && !p.rightClick)
            $(self.target).addClass(self.css_class.target_clicked);
    }

	/**
	 * Ajax请求失败的处理
	 * @param {Object} self - 插件内部对象
	 * @param {string} errorThrown - Ajax的错误输出内容
	 */
	SelectMenu.prototype.ajaxErrorNotify = function(self, errorThrown) {
		self.showMessage(self.message.ajax_error);
	};
	
	/**
	 * 交互消息显示
	 * @param {Object} self - 插件内部对象
	 * @param msg {string} 需要提示的文本
	 */
	SelectMenu.prototype.showMessage = function(self,msg){
		if(!msg) return;
		var msgLi = '<li class="sm_message_box"><i class="iconfont icon-warn"></i> '+msg+'</li>';
		$(self.elem.results).empty().append(msgLi);
		self.calcResultsSize(self);
		$(self.elem.container).addClass(self.css_class.container_open);
		$(self.elem.control).hide();
	};

	/**
	 * 输入框输入值的变化监控
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.checkValue = function(self) {
		var now_value = $(self.elem.input).val();
		if (now_value != self.prop.prev_value) {
			self.prop.prev_value = now_value;
			self.suggest(self);
		}
	};

    /**
     * 文本输入框键盘事件处理（普通字符输入处理）
     * @param {Object} self - 插件内部对象
     * @param {Object} e - 事件event对象
     */
    SelectMenu.prototype.processKey = function(self, e){
        //处理普通字符输入
        if($.inArray(e.keyCode, [38, 40, 27, 9, 13]) === -1){
            //if(e.keyCode != 16) self.setCssFocusedInput(self); // except Shift(16)
            if($.type(self.option.data) === 'string'){
                self.prop.last_input_time = e.timeStamp;
                setTimeout(function(){
                    if((e.timeStamp - self.prop.last_input_time) === 0)
                        self.checkValue(self);
                },self.option.inputDelay * 1000);
            }else{
                self.checkValue(self);
            }
        }
    }

	/**
	 * 文本输入框键盘事件处理（控制键处理）
	 * @param {Object} self - 插件内部对象
	 * @param {Object} e - 事件event对象
	 */
	SelectMenu.prototype.processControl = function(self, e) {
		if (($.inArray(e.keyCode, [38, 40, 27, 9]) > -1 && $(self.elem.container).is(':visible')) ||
			($.inArray(e.keyCode, [13, 9]) > -1 && self.getCurrentLine(self))) {
			e.preventDefault();
			e.stopPropagation();
			e.cancelBubble = true;
			e.returnValue = false;
			switch (e.keyCode) {
			case 38:// up
				self.prop.key_select = true;
				self.prevLine(self);
				break;
			case 40:// down
				if ($(self.elem.results).children('li').length) {
					self.prop.key_select = true;
					self.nextLine(self);
				} else self.suggest(self);
				break;
			case 9:// tab
				self.selectCurrentLine(self, true);
				//self.hideResults(self);
				break;
			case 13:// return
				self.selectCurrentLine(self, true);
				break;
			case 27://  escape
				self.hideResults(self);
				break;
			}
		}
	};


    /**
     * 为插件设置初始化的选中值（若有指定的话），执行第一步，数据匹配
     */
    SelectMenu.prototype.populate = function() {
        var self = this, p = this.option;
        if(!p.regular) $(self.elem.input).val('');
        /**
         * 1.处理用于实际使用的数据
         */
        if(p.data){
            if($.type(p.data) === 'array'){
                self.prop.data = p.data;
            }else if($.type(p.data) === 'function'){
                self.prop.data = p.data();
            }
        }
        //检查数据类型
        if($.type(self.prop.data) === 'array')
            this.prop.data_type = this.checkDataType(self.prop.data);
        /**
         * 2.处理选中的项目
         */
        if($.type(p.data) !== 'string') self.setInitSelected(self, self.prop.data);
        /**
         * 3.展示数据
         */
        if(p.regular) self.regularMenuInit();
        else self.suggest(self);
    };

	/**
	 * 数据查询
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.suggest = function(self) {
		//搜索关键字
		var q_word, p = self.option;
        var val = $.trim($(self.elem.input).val());
        if(p.multiple) q_word = val;
        else{
            if(val && val === self.prop.selected_text) q_word = '';
            else q_word = val;
        }
		q_word = q_word.split(/[\s　]+/);
		self.setLoading(self);
		// 数据查询
		if ($.type(p.data) === 'array' || $.type(p.data) === 'function') self.searchForJson(self, q_word);
	};

	/**
	 * @private
	 * 读取中状态显示
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.setLoading = function(self) {
		//加载中的状态提示
		if ($(self.elem.results).html() === '') {
			//self.calcResultsSize(self);
			if(!self.option.embed) $(self.elem.container).addClass(self.css_class.container_open);
		}
	};

	/**
	 * 对JSON源数据进行搜索
	 * @param {Object} self - 插件内部对象
	 * @param {Array} q_word - 搜索关键字
	 */
	SelectMenu.prototype.searchForJson = function(self, q_word) {
	    var p = self.option, innerData = self.prop.data;
		var matched = [], esc_q = [], sorted = [], json = {}, i = 0, arr_reg = [];
		//查询条件过滤
		do {
			//'/\W/g'正则代表全部不是字母，数字，下划线，汉字的字符
			//将非法字符进行转义
			esc_q[i] = q_word[i].replace(/\W/g, '\\$&').toString();
			arr_reg[i] = new RegExp(esc_q[i], 'gi');
			i++;
		} while ( i < q_word.length );
        var d = [];
        if(self.prop.data_index > (p.data.length-1) || self.prop.data_index < 0) self.prop.data_index = 0;
        if(self.prop.data_type === SelectMenu.dataTypeGroup){
            d = innerData[self.prop.data_index].list;
        }else d = innerData;
		// SELECT * FROM data WHERE field LIKE q_word;
		for (i = 0; i < d.length; i++) {
			var flag = false;
			var row = d[i];
			for (var j = 0; j < arr_reg.length; j++) {					
				var itemText = row[p.showField];//默认获取showField字段的文本
				if(p.formatItem && $.isFunction(p.formatItem))
					itemText = p.formatItem(row);
				if (itemText.match(arr_reg[j])) {
					flag = true;
					if (p.andOr == 'OR') break;
				} else {
					flag = false;
					if (p.andOr == 'AND') break;
				}
			}
			if (flag) matched.push(row);
		}
		
		// (CASE WHEN ...) 然后 く order 指定列
		var reg1 = new RegExp('^' + esc_q[0] + '$', 'gi');
		var reg2 = new RegExp('^' + esc_q[0], 'gi');
		var matched1 = [];
		var matched2 = [];
		var matched3 = [];
		for (i = 0; i < matched.length; i++) {
		    var orderField = p.orderBy[0][0];
            var orderValue = String(matched[i][orderField]);
			if (orderValue.match(reg1)) {
				matched1.push(matched[i]);
			} else if (orderValue.match(reg2)) {
				matched2.push(matched[i]);
			} else {
				matched3.push(matched[i]);
			}
		}

		if (p.orderBy[0][1].match(/^asc$/i)) {
			matched1 = self.sortAsc(self, matched1);
			matched2 = self.sortAsc(self, matched2);
			matched3 = self.sortAsc(self, matched3);
		} else {
			matched1 = self.sortDesc(self, matched1);
			matched2 = self.sortDesc(self, matched2);
			matched3 = self.sortDesc(self, matched3);
		}
		sorted = sorted.concat(matched1).concat(matched2).concat(matched3);

        //若没有匹配项目，则结束搜索
        /*
        if (sorted.length === undefined || sorted.length === 0 ) {
            self.notFoundSearch(self);
            return;
        }
        */
        //json.cnt_whole = sorted.length;

		//储存原始行数据，包括所有属性
		json.originalResult = [];
        if(json.keyField === undefined) json.keyField = [];
        if(json.candidate === undefined) json.candidate = [];
		// 查询后的数据处理
		$.each(sorted, function(i,row){
		    if(row === undefined || $.type(row) !== 'object') return true;
            json.originalResult.push(row);
            if(row.hasOwnProperty(p.keyField) && row.hasOwnProperty(p.showField)){
                json.keyField.push(row[p.keyField]);
                json.candidate.push(row[p.showField]);
            }
        });

		//json.cnt_page = json.candidate.length;
		self.prepareResults(self, json, q_word);
	};

	/**
	 * 升序排序
	 * @param {Object} self - 插件内部对象
	 * @param {Array} arr - 结果集数组
	 */
	SelectMenu.prototype.sortAsc = function(self, arr) {
		arr.sort(function(a, b) {
		    var valA = a[self.option.orderBy[0][0]];
		    var valB = b[self.option.orderBy[0][0]];
            return $.type(valA) === 'number' ? valA - valB : String(valA).localeCompare(String(valB));
		});
		return arr;
	};

	/**
	 * 降序排序
	 * @param {Object} self - 插件内部对象
	 * @param {Array} arr - 结果集数组
	 */
	SelectMenu.prototype.sortDesc = function(self, arr) {
		arr.sort(function(a, b) {
            var valA = a[self.option.orderBy[0][0]];
            var valB = b[self.option.orderBy[0][0]];
            return $.type(valA) === 'number' ? valB - valA : String(valB).localeCompare(String(valA));
		});
		return arr;
	};

	/**
	 * 查询无结果的处理
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.notFoundSearch = function(self) {
		$(self.elem.results).empty();
		self.calcResultsSize(self);
		$(self.elem.container).addClass(self.css_class.container_open);
		self.setCssFocusedInput(self);
	};

	/**
	 * 查询结果处理
	 * @param {Object} self - 插件内部对象
	 * @param {Object} json - 数据结果
	 * @param {Array} q_word - 查询关键字
	 */
	SelectMenu.prototype.prepareResults = function(self, json, q_word) {
		if (!json.keyField) json.keyField = false;

		//仅选择模式
		if (self.option.selectOnly && json.candidate.length === 1 && json.candidate[0] == q_word[0]) {
			$(self.elem.hidden).val(json.keyField[0]);
			this.setButtonAttrDefault();
		}
		//是否是输入关键词进行查找
		var is_query = false;
		if (q_word && q_word.length > 0 && q_word[0]) is_query = true;
		//设置初始化项目
		self.setInitSelected(self,json.originalResult);
		//显示结果列表
		self.displayResults(self, json, is_query);
	};

	/**
	 * 显示结果集列表
	 * @param {Object} self - 插件内部对象
	 * @param {Object} json 源数据
	 * @param {boolean} is_query - 是否是通过关键字搜索（用于区分是鼠标点击下拉还是输入框输入关键字进行查找）
	 */
	SelectMenu.prototype.displayResults = function(self, json, is_query) {
	    var p = self.option, el = self.elem;
		$(el.results).hide().empty();

		// build tabs
        if(self.prop.data_type === SelectMenu.dataTypeGroup) {
            var ul = $('<ul>');
            $.each(self.prop.data,function(i,row){
                var a = $('<a href="javascript:void(0);">').html(row.title).attr({
                    'tab_id' : self.prop.menu_tab_id_prefix + (i+1),
                    'data_index' : i
                });
                if(i === self.prop.data_index) $(a).addClass('active');
                var li = $('<li>').append(a);
                ul.append(li);
            });
            el.resultTabs.empty().append(ul);
        }else{
            $(el.resultTabs).hide();
            if(p.title || p.search) el.resultArea.addClass(this.css_class.re_list);
        }

		if(p.multiple && $.type(p.maxSelectLimit) === 'number' && p.maxSelectLimit > 0){
			var selectedSize = $('li.selected_tag',el.element_box).size();
			if(selectedSize > 0 && selectedSize >= p.maxSelectLimit){
				self.showMessage(self,'最多只能选择 '+p.maxSelectLimit+' 个项目');
				return;
			}
		}

		if(json.candidate.length > 0){
            var arr_candidate = json.candidate;
            var arr_primary_key = json.keyField;
            for (var i = 0; i < arr_candidate.length; i++) {
                var itemText = '', custom = false, row = json.originalResult[i];
                if(p.formatItem && $.isFunction(p.formatItem)){
                    try {
                        itemText = p.formatItem(row);
                        custom = true;
                    } catch (e) {
                        console.error('formatItem内容格式化函数内容设置不正确！');
                        itemText = arr_candidate[i];
                    }
                }else itemText = arr_candidate[i];
                var icon = $('<div>').html('<i class="iconfont icon-selected">').addClass(self.css_class.selected_icon);
                var text = $('<div>').html(itemText).addClass(self.css_class.item_text);
                var li = $('<li>').append(icon).append(text).attr('pkey' , arr_primary_key[i]);
                if(!custom) $(li).attr('title',itemText);

                //选中项目设置高亮样式
                if ($.inArray(row,self.prop.values) !== -1) {
                    $(li).addClass(self.css_class.selected);
                }
                //缓存原始行对象
                $(li).data('dataObj',row);
                $(el.results).append(li);
            }
        }else{
		    var li = '<li class="sm_message_box"><i class="iconfont icon-warn"></i> ' + self.message.not_found + '</li>';
            $(el.results).append(li);
        }
        $(el.results).show();

		//显示结果集列表并调整位置
		self.calcResultsSize(self);
		if(!p.embed) $(el.container).addClass(self.css_class.container_open);

		//结果集列表事件绑定
		self.eResultList();
		//若是键盘输入关键字进行查询且有内容时，列表自动选中第一行(autoSelectFirst为true时)
		//if (is_query && json.candidate.length > 0 && p.autoSelectFirst) self.nextLine(self);
		self.atLast();
	};

	/**
	 * 处理结果列表尺寸及位置
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.calcResultsSize = function(self) {
	    var p = self.option, el = self.elem;
	    var hasScroll = function(){
	        return $(document).height() > $(window).height();
        };
	    var setListHeight = function(){
            if(!p.regular){
                //设置列表高度
                var itemHeight = $('li:first',el.results).outerHeight();
                var listHeight = itemHeight * p.listSize;
                $(el.results).css({
                    'max-height':listHeight
                });
            }
        };
	    var scrollFlag = hasScroll();
	    var rePosition = function(){
	        if(p.rightClick) return {top : self.prop.y, left : self.prop.x};
            var boxoffset = $(self.target).offset();
            var t = boxoffset.top;
            var menuWidth = $(el.container).outerWidth();
            //$(self.target).outerWidth(true);
            var targetWidth = Math.round($(self.target)[0].getBoundingClientRect().width);
            t += $(self.target).outerHeight(true) + 5;
            if(p.arrow && !p.embed) t += $(el.arrow).outerHeight(true);

            var l = boxoffset.left;
            switch (p.position){
                case 'left':
                    if(p.arrow) $(el.arrow).css('left',targetWidth / 2);
                    break;
                case 'right':
                    l = l + targetWidth - menuWidth;
                    if(p.arrow) $(el.arrow).css('left',menuWidth - (targetWidth / 2));
                    break;
                case 'center':
                    l = l + (targetWidth / 2) - (menuWidth / 2);
                    break;
            }
            return {top : t,left : l};
        }
	    if($(el.container).is(':visible')){
            setListHeight();
            if(!p.embed) $(el.container).offset(rePosition());
        }else{
            $(el.container).show(1,function(){
                setListHeight();
                $(this).offset(rePosition());
            });
        }
        if(scrollFlag !== hasScroll()) $(el.container).offset(rePosition());
	};

	/**
	 * 隐藏结果列表
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.hideResults = function(self) {
		if (self.option.autoFillResult) {
			//self.selectCurrentLine(self, true);
		}

		if(!self.option.regular) $(self.elem.results).empty();
		if(!self.option.embed){
            $(self.elem.container).removeClass(self.css_class.container_open).hide();
            if($(self.target).is('button,.btn')) $(self.target).removeClass(self.css_class.target_clicked);
        }
	};
	/**
	 * 操作结束后的一些收尾工作
	 */
	SelectMenu.prototype.afterAction = function(self){
	    //$(self.elem.input).change();
		if(self.option.multiple){
			if(self.option.selectToCloseList){
				self.hideResults(self);
				$(self.elem.input).blur();
			}else{
				//self.suggest(self);
				$(self.elem.input).focus();
			}
		}else{
			self.hideResults(self);
			$(self.elem.input).blur();
		}
	};

    /**
     * 获得当前行对象
     * @param {Object} self - 插件内部对象
     */
    SelectMenu.prototype.getCurrentLine = function(self) {
        if ($(self.elem.container).is(':hidden')) return false;
        var obj = $('li.' + self.css_class.select,self.elem.results);
        if ($(obj).size()) return obj;
        else return false;
    };

    /**
     * 获得当前选中的行对象
     * @param self
     * @returns {*}
     */
    SelectMenu.prototype.getSelectedLine = function(self) {
        if ($(self.elem.container).is(':hidden')) return false;
        var obj = $('li.' + self.css_class.selected,self.elem.results);
        if ($(obj).size()) return obj;
        else return false;
    };

	/**
	 * 选择当前行
	 * @param {Object} self - 插件内部对象
	 * @param {boolean} is_enter_key - 是否为回车键
	 */
	SelectMenu.prototype.selectCurrentLine = function(self, is_enter_key) {
		var current = self.getCurrentLine(self),p = self.option;
		if (current) {
		    var rowData = $(current).data('dataObj');

			var id = String(rowData[p.keyField]);
			if($.inArray(rowData,self.prop.values) === -1){
			    if(!p.multiple) self.prop.values.splice(0,self.prop.values.length);
			    self.prop.values.push(rowData);
			    $(current).addClass(self.css_class.selected);
            } else{
			    self.prop.values.splice($.inArray(rowData,self.prop.values),1);
                $(current).removeClass(self.css_class.selected);
            }

            //项目选择回调函数触发
            if(p.eSelect && $.isFunction(p.eSelect)){
                if(p.multiple){
                    p.eSelect(self.prop.values);
                }else p.eSelect([rowData]);
            }

			self.prop.prev_value = $(self.elem.input).val();
			self.prop.selected_text = $(self.elem.input).val();
		}
		self.afterAction(self);
	};

	/**
	 * 全选当前页的行
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.selectAllLine = function(self){
		$('li',self.elem.results).each(function(i,row){
			var d = $(row).data('dataObj');
			if($.inArray(d,self.prop.values) === -1) self.prop.values.push(d);
            $(this).addClass(self.css_class.selected);
			//若有最大选择数量限制，则添加最大个数后，不再添加
            /*
			if($.type(self.option.maxSelectLimit) === 'number' &&
                self.option.maxSelectLimit > 0 &&
                self.option.maxSelectLimit === $('li.selected_tag',self.elem.element_box).size()){
			    return false;
            }
            */
		});
		if(self.option.eSelect && $.isFunction(self.option.eSelect))
			self.option.eSelect(self.prop.values);
		self.afterAction(self);
	};
	/**
	 * 清除所有选中的项目
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.clearAll = function(self){
        var p = self.option, el = self.elem;
        $(el.input).val('');
        $('li',el.results).each(function(i,row){
            $(this).removeClass(self.css_class.selected);
        });
        self.prop.values.splice(0,self.prop.values.length);
		self.afterAction(self);
        if (p.eSelect && $.isFunction(p.eSelect)) p.eSelect([]);
	};

	/**
	 * 选择下一行
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.nextLine = function(self) {
		var obj = self.getCurrentLine(self), el = self.elem, idx;
		if (!obj) idx = -1;
		else {
			idx = $(el.results).children('li').index(obj);
			$(obj).removeClass(self.css_class.select);
		}
		idx++;
		var size = $('li',el.results).size();
		if(idx === size) idx = size - 1;
		if (idx < size) {
			var next = $(el.results).children('li').eq(idx);
			$(next).addClass(self.css_class.select);

            var itemHeight = $('li:first',el.results).outerHeight(true);
			var curTop = $(next).position().top;
			var curScrollTop = $(el.resultArea).scrollTop();
			var listHeight = $(el.resultArea).outerHeight(true);
            var dist = curTop + itemHeight - listHeight;
			if((curTop + itemHeight) > listHeight)
			    $(el.resultArea).scrollTop(curScrollTop + dist);
		}
	};

	/**
	 * 选择上一行
	 * @param {Object} self - 插件内部对象
	 */
	SelectMenu.prototype.prevLine = function(self) {
	    var el = self.elem, idx;
		var obj = self.getCurrentLine(self);
		if (!obj) idx = $(el.results).children('li').length;
		else {
			idx = $(el.results).children('li').index(obj);
			$(obj).removeClass(self.css_class.select);
		}
		idx--;
		if(idx < 0) idx = 0;
		if (idx > -1) {
			var prev = $(el.results).children('li').eq(idx);
			$(prev).addClass(self.css_class.select);

            var itemHeight = $('li:first',el.results).outerHeight(true);
            var curTop = $(prev).position().top;
            var curScrollTop = $(el.resultArea).scrollTop();
            var listHeight = $(el.resultArea).outerHeight(true);
            //var dist = curTop;
            if(curTop < 0)
                $(el.resultArea).scrollTop(curScrollTop - (0 - curTop));
		}
	};

    /**
     * 列表是显示还是隐藏状态
     * @param self
     */
	SelectMenu.prototype.isVisible = function(self){
        return $(self.elem.container).hasClass(self.css_class.container_open);
    }


	/**
	 * 控件初始化入口
	 * @global
	 * @memberof jQuery,bootstrap2,bootstrap3
	 * @param option {Object} 初始化参数集
	 */
	function Plugin(option) {
		return this.each(function(){
			var $this = $(this),
				data = $this.data(SelectMenu.dataKey),
				params = $.extend({}, defaults, $this.data(), data && data.option ,typeof option === 'object' && option);
			if(!data) $this.data(SelectMenu.dataKey,(data =  new SelectMenu(this,params)));
			else{
			    if(data.isVisible(data)) data.hideResults(data);
			    else data.showMenu(data);
            }
		});
	}

	var old = $.fn.selectMenu;

	$.fn.selectMenu              = Plugin;
	$.fn.selectMenu.Constructor = SelectMenu;
	
	// 处理新旧版本冲突
	// =================
	$.fn.selectMenu.noConflict = function () {
		$.fn.selectMenu = old;
		return this;
	};
})(window.jQuery);