var treeid

function setCookie(c_name, value, exdays) {
    c_name = c_name.replace(/(\r\n|\n|\r)/gm,"");
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value + ";path=/";
}

function getCookie(c_name) {
    c_name = c_name.replace(/(\r\n|\n|\r)/gm,"");
    var i;
    var x;
    var y;
    var ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name)
     	    return unescape(y);
    }
    return "NA"
}


(function($){
	$.fn.bonsai = function( options ) {
		return this.each(function() {
			var bonsai = new Bonsai(this, options);
			$(this).data('bonsai', bonsai);
		});
	};
	$.bonsai = {};
	$.bonsai.defaults = {
		expandAll: false, // boolean expands all items
		expand: null, // function to expand an item
		collapse: null, // function to collapse an item
		checkboxes: false, // requires jquery.qubit
		// createCheckboxes: creates checkboxes for each list item.
		// 
		// The name and value for the checkboxes can be declared in the
		// markup using `data-name` and `data-value`.
		// 
		// The name is inherited from parent items if not specified.
		// 
		// Checked state can be indicated using `data-checked`.
		createCheckboxes: false,
		// handleDuplicateCheckboxes: adds onChange bindings to update 
		// any other checkboxes that have the same value.
		handleDuplicateCheckboxes: false,
		selectAllExclude: null
	};
	var Bonsai = function( el, options ) {
		var self = this,
			options = $.extend({}, $.bonsai.defaults, options),
			checkboxes, isRootNode;
		this.el = el = $(el);
		// store the scope in the options for child nodes
		if( !options.scope ) {
			options.scope = el;
			isRootNode = true;
		}
		this.options = options;
		el.addClass('bonsai');

    if (options.uuid) {
      treeid = options.uuid;
    }
    else {
      treeid = "aa";
    }
		
		if( options.checkboxes ) {
			checkboxes = true;
			// handle checkboxes once at the root of the tree, not on each element
			options.checkboxes = false;
		}
		// look for a nested list (if any)
		el.children().each(function() {
			var item = $(this),
				// insert a thumb
				thumb = $('<div class="thumb" />');
			if( options.createCheckboxes ) {
				// insert a checkbox after the thumb
				self.insertCheckbox(item);
			}
			item.prepend(thumb);
			// if there is a child list
			$(this).children().filter('ol, ul').last().each(function() {
				// that is not empty
				if( $('li', this).length == 0 ) {
					return;
				}
				// then this el has children
				item.addClass('has-children')
					// attach the sub-list to the item
					.data('subList', this);
				thumb.on('click', function() {
					self.toggle(item);
				});
				// collapse the nested list
        id = item[0].outerText.split('\n')[0];
        id = treeid + '_' + id;
        var status = getCookie(id);

			  if (status == 'expanded') {

					self.expand(item);
        }
        else if (status == 'collapsed') {
          self.collapse(item);
        }
        else {  //EXPAND?
          if( options.expandAll || item.hasClass('expanded') ) {
            self.expand(item);
          }
          else {
            self.collapse(item);
          }
        }

				// handle any deeper nested lists
				$(this).bonsai(options)
			});
		});
		// if this is root node of the tree
		if( isRootNode ) {
			if( checkboxes )
				el.qubit(options);
			if( this.options.addExpandAll )
				this.addExpandAll();
			if( this.options.addSelectAll )
				this.addSelectAll();
		} 
		this.expand = options.expand || this.expand;
		this.collapse = options.collapse || this.collapse;
		this.el.data('bonsai', this);
		this.initialised = true;
	};
	Bonsai.prototype = {
		initialised: false,
		toggle: function( listItem ) {
			if( !$(listItem).hasClass('expanded') ) {
        id = listItem[0].outerText.split('\n')[0];
        id = treeid + '_' + id;
        setCookie(id, "expanded", 100);
				this.expand(listItem);
			}
			else {
        id = listItem[0].outerText.split('\n')[0];
        id = treeid + '_' + id;
        setCookie(id, "collapsed", 100);
				this.collapse(listItem);
			}
		},
		expand: function( listItem ) {
	        id = listItem[0].outerText.split('\n')[0];
	        id = treeid + '_' + id;
	        setCookie(id, "expanded", 100);
			this.setExpanded(listItem, true);
		},
		collapse: function( listItem ) {
    	    id = listItem[0].outerText.split('\n')[0];
    	    id = treeid + '_' + id;
    	    setCookie(id, "collapsed", 100);
			this.setExpanded(listItem, false);
		},
		setExpanded: function( listItem, expanded ) {
			listItem = $(listItem);
			if( listItem.length > 1 ) {
				var self = this;
				listItem.each(function() {
					self.setExpanded(this, expanded);
				});
				return;
			}
			if( expanded ) {
				if( !listItem.data('subList') )
					return;
				listItem = $(listItem).addClass('expanded')
					.removeClass('collapsed');
				$(listItem.data('subList')).css('height', 'auto');
			}
			else {
				listItem = $(listItem).addClass('collapsed')
					.removeClass('expanded');
				$(listItem.data('subList')).height(0);
			}
		},
		expandAll: function() {
			this.expand($('li', this.el));
		},
		collapseAll: function() {
			this.collapse($('li', this.el));
		},
		insertCheckbox: function( listItem ) {
			var id = this.generateId(listItem),
				checkbox = $('<input type="checkbox" name="' 
					+ this.getCheckboxName(listItem)
					+ '" id="' + id  + '" /> '
				),
				children = listItem.children(),
				// get the first text node for the label
				text = listItem.contents().filter(function() {
						return this.nodeType == 3;
					}).first(),
				self = this;
			checkbox.val(listItem.data('value'));
			checkbox.prop('checked', listItem.data('checked'))
			children.remove();
			listItem.append(checkbox)
				.append($('<label for="' + id + '">')
					.append(text ? text : children.first())
				)
				.append(text ? children : children.slice(1));
			if( this.options.handleDuplicateCheckboxes ) {
				this.handleDuplicates(checkbox);
			}
		},
		handleDuplicates: function( checkbox ) {
			var self = this,
				checkbox = $(checkbox);
			checkbox.bind('change', function(e) {
				var isChecked = checkbox.prop('checked');
				if( this.value ) {
					var id = this.id;
					e.duplicateIds = e.duplicateIds || [];
					e.duplicateIds.push(id);
					// select all duplicate checkboxes within the same scope
					self.options.scope
						.find('input[type=checkbox]')
						.filter('[value="' + $(checkbox).attr('value') + '"][name="' + $(checkbox).attr('name') + '"]'
							+ (isChecked ? ':not(:checked)' : ':checked'))
						.filter(function() {
							return e.duplicateIds.indexOf(this.id) == -1;
						})
						.each(function() {
							// copy checked and indeterminate to the duplicate
							$(this).prop({
									checked: isChecked,
									indeterminate: $(this).prop('indeterminate')
								})
								.trigger({
									type: 'change',
									duplicateIds: e.duplicateIds,
									doneIds: e.doneIds
								});
						});
				}
				return true;					
			});
		},
		idPrefix: 'checkbox-',
		generateId: function( listItem ) {
			do {
				var id = this.idPrefix + Bonsai.uniqueId++;
			}
			while( $('#' + id).length > 0 );
			return id;
		},
		getCheckboxName: function( listItem ) {
			return listItem.data('name')
				|| listItem.parents().filter('[data-name]').data('name');
		},
		addExpandAll: function() {
			var self = this,
				scope = this.options.scope;
			$('<div class="expand-all">')
				.append($('<a class="all">Expand all</a>')
					.css('cursor', 'pointer')
					.bind('click', function() {
						self.expandAll();
					})
				)
				.append('<i class="separator"></i>')
				.append($('<a class="none">Collapse all</a>')
					.css('cursor', 'pointer')
					.bind('click', function() {
						self.collapseAll();
					})
				)
				.insertBefore(this.el);
		},
		addSelectAll: function() {
			var scope = this.options.scope,
				self = this;
			function getCheckboxes() {
				// return all checkboxes that are not in hidden list items
				return scope.find('li')
					.filter(self.options.selectAllExclude || function() {
						return $(this).css('display') != 'none';
					})
					.find('> input[type=checkbox]');
			}
			$('<div class="check-all">')
				.append($('<a class="all">Select all</a>')
					.css('cursor', 'pointer')
					.bind('click', function() {
						getCheckboxes().prop({
							checked: true,
							indeterminate: false
						});
					})
				)
				.append('<i class="separator"></i>')
				.append($('<a class="none">Select none</a>')
					.css('cursor', 'pointer')
					.bind('click', function() {
						getCheckboxes().prop({
							checked: false,
							indeterminate: false
						});
					})
				)
				.insertAfter(this.el);
		},
		setCheckedValues: function( values ) {
			var all = this.options.scope.find('input[type=checkbox]');
			$.each(values, function(key, value) {
				all.filter('[value="' + value + '"]')
					.prop('checked', true)
					.trigger('change');
			});
		}
	};
	$.extend(Bonsai, {
		uniqueId: 0
	});
}(jQuery));
