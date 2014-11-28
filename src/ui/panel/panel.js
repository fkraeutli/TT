TT.ui.panel = function() {
	
	if(!TT.ui.panel.id) TT.ui.panel.id = 0;
	
	var	initialised = false,
		id = TT.ui.panel.id++,
		me = {},
		nmsp = "ui_" + id,
		x,
		y,
		zoom;
		
	var p = {
		
		elements: {
			
		},
		
		data: [],
		
		heap: false,
		
		fields: [],
				
		parent: false,
		
		record: {
			
			title: function(d) { return d.title; },
			subtitle: function(d) { return d.subtitle; },
			image: function(d) { return d.image; }
			
		},
		
		styles: {
			
			panel: {
				
				height: 0.6, // 60%
				width: 0.25, // 25%
				
				pointer: {
					width: 10,
					height: 20
				}
			}

		},
		
		view: {}
	};
	
	// REMOVE
	test_ui_p = p;
	
	function panel( params ) {
		
		if( !params.event || !params.data ) {
		
			return false;
			
		}
		
		function bufferPanel() {
			
			showPanel( params );
			
			p.elements.panel.html( "" )
				.append( "div" )
				.attr( "class", "loading" );
			
		}
		
		function doesMatch( d, data ) {
			
			var value = data.accessor( d ),
				matches = false;
			
			if ( ! jQuery.isArray( value ) ) {
													
				if( value == data.selected ) {
			
					matches = true;
				
				}
				
			} else {
				
				var found = 0;
				
				for( var i = 0; i < data.selected.length; i++ ) {	
					
					if ( value.indexOf( data.selected[ i ] ) != -1 ) {
						
						found++;
						
					}
					
				}
				
				if ( found == data.selected.length ) {
					
					matches = true;
					
				}
				
			}
			
			return matches;
			
		}
		
		function loadContent( data ) {
		
			function addHeader() {
						
				// Add header
				var header = p.elements.panel.append("div")
					.attr( "class", "header" )
					.style( "background-image", "url(" + p.record.image.call( p.record.image, data ) + ")" );
					
				header.append("h2")
					.html( p.record.title.call( p.record.title, data ) );
				header.append("h3")
					.html( p.record.subtitle.call( p.record.subtitle, data ) );		
				
			}
			
			function addList() {
							
				// Add list
				p.elements.panel.append("ul").attr("class", "select").selectAll("li").data( p.fields )
					.enter()
				.append("li")
					.html( function(d) {
						
						var content = d.accessor( data );
						
						if ( jQuery.isArray( content ) ) {
							
							content = content.join( ", " );
							
						}
						
						return "<label>" + d.title + "</label>" + content; 
						
					} )
					.on( "click", function(d) {
						
						var obj = this;
						
						function doLoadField() {
							
							d.selected = d.accessor( data );
							
							if ( jQuery.isArray( d.selected ) ) {
								
								d.options = d.accessor( data );
								
							} else {
								
								d.options = false;
								
							}
										
							loadField( d );
							
						}
						
						if ( d.initialise && typeof d.initialise == "function" ) {
							
							console.log( d );
							
							bufferPanel();
							
							d.initialise( doLoadField );
							
						} else {
							
							doLoadField();
							
						}
						
					});
				
			}
			
			clearPanel();
			
			addHeader();
			addList();
		}	
		
		function loadField( data ) {
			
			function addHeader () {
				
				var reloadField = function () {
					
					var selected = Array();
					
					header.select(".values").selectAll( "input[type=checkbox]").each( function( d ) {
						
						if ( jQuery( this ).is( ":checked" ) ) {
							
							selected.push( d );
							
						}
						
					} );
					
					data.selected = selected;
					
					loadField( data );	
					
				};
				
				
				var header = p.elements.panel.append("ul")
					.attr("class", "header");
				
				header.append("li")
					.append( "a" )
					.attr( "class", "back" )
					.attr( "href", "#" )
					.html( "Back" );
								
				if ( ! data.options ) {
					
					header.append("li")
						.html( function() {
							return "<label>" + data.title + "</label>" + data.selected;
							
						} );
					
				} else {
					
					var li = header.append("li")
						.html( function() {
							return "<label>" + data.title + "</label><div class=\"values\"></div>";
							
						} );
					
					var enter = li.select( ".values" )
						.append( "ul" )
						.selectAll( "li" )
					.data( data.options )
						.enter()
						.append( "li" );
						
					enter.append( "input" )
						.attr( "id", function( d ) {
							
							return "input-" + data.field + "-" + d;
							
						} )
						.attr( "type", "checkbox" )
						.attr( "value", function( d )  {
							
							return d;
							
						} )
						.attr( "checked", function( d ) {
							
							if ( data.selected.indexOf( d ) != -1 ) {
								
								return "checked";
								
							}
							
						} )
						.on( "click", reloadField );
						
					enter.append( "label" )
						.attr( "for", function( d ) {
							
							return "input-" + data.field + "-" + d;
							
						} )
						.html( function( d ) {
							
							return d;
							
						} )
						.on( "click", reloadField );
				
				}
					
				header.select("a.back")
					.on("click", function() {
						loadContent( p.elements.panel.datum() );
					});
			
			}
			
			function addInstructions() {
				
				p.elements.panel.append("div")
					.attr("class", "instructions")
				.append("p")
					.html( "or" );
				
			}
			
			function addOperations() {
				
				var operations = p.elements.panel.append("ul")
					.attr("class", "operations");
					
				var buttons = [
					{
						title: "Colour",
						description: "Colour all the items matching " + data.title + " \"" +  data.selected + "\"",
						action: function() {
							
							loadFilterByColour( data );
							
						}
					}, 
					{
						title: "Duplicate",
						description: "Create a new heap with the items matching " + data.title + " \"" +  data.selected + "\"",
						action: function() {
							
							var newDataset = p.heap.data().filter( function(d) { 
								
								if ( ! jQuery.isArray( data.selected ) ) {
	
									return data.accessor(d) != data.selected;
								
								} else {
									
									return doesMatch( d, data );
									
								}
										
							} ); 
							
							
							console.log( "doing");
							console.log( newDataset );
							
							var newHeap = TT.layout.heap().data( newDataset );
							
							p.heap.parent().add( newHeap );
							
							TT.ui.panel().heap( newHeap ).fields( p.fields ).record( p.record ).initialise();
							
							hidePanel();
	
						}
					}, 
					{
						title: "Separate",
						description: "Separate all items matching " + data.title + " \"" +  data.selected + "\" from their current heap",
						action: function() {
							
							var newDataset = p.heap.data().filter( function(d) { 
								
								if ( ! jQuery.isArray( data.selected ) ) {
	
									return data.accessor(d) != data.selected;
								
								} else {
									
									return doesMatch( d, data );
									
								}
										
							} ); 
							
							var newHeap = TT.layout.heap().data( newDataset );
							
							p.heap.parent().add( newHeap );
							
							TT.ui.panel().heap( newHeap ).fields( p.fields ).record( p.record ).initialise();
							
							p.heap.data( p.heap.data().filter( function(d) { 
									
								if ( ! jQuery.isArray( data.selected ) ) {
									
									return data.accessor(d) != data.selected;
									
								} else {
								
									return ! doesMatch( d, data );
									
								}
							
							} ) ) ; 
								
							p.data = p.heap.data();  // TODO: Are field values repopulated?
							
							hidePanel();
	
						}
						
					},
					{
						
						title: "Remove",
						description: "Remove all items matching " + data.title + " \"" +  data.selected + "\"",
						action: function() {
							
							if( p.heap ) {
								
								// TODO update to support array fields
								
								
								p.heap.data( p.heap.data().filter( function(d) { 
									
									if ( ! jQuery.isArray( data.selected ) ) {
										
										return data.accessor(d) != data.selected;
										
									} else {
									
										return ! doesMatch( d, data );
										
									}
								
								} ) ) ; 
									
								p.data = p.heap.data(); // TODO: Are field values repopulated?
								
								hidePanel();
								
							}
							
						}
					}
				];
				
				operations.selectAll("li").data(buttons)
					.enter()
					.append("li")
					.html( function(d) { 
						
						return "<a class=\"button\" href=\"#\">" + d.title + "</a><p class=\"description\">" + d.description + "</p>";
						
					})
				.select("a")
					.on("click", function(d) {
						d.action();
					});
					
				
				
			} 
			
			function addSelect() {
				
				function populateSelect() {					
					
					if ( ! data.values ) {
						
						populateField( data );
						
					}
					
					select.selectAll("option")
						.data( data.values )
					.enter()
						.append("option")
						.html(function(d) { return d; });
						
					select.on("mouseover", null);
						
				}
				
				var select = p.elements.panel.append("select")
				
					.attr("class", "select")
					.on("change", function(d) {
						
						var selected = this.options[ this.selectedIndex ].__data__ ;
						
						if( data.options && data.options.indexOf( selected ) == -1 ) {
							
							data.options.push( selected );
							
						}
						
						if ( ! jQuery.isArray( data.selected) ) {
							
						
							data.selected = selected;
							
						} else {
							
							data.selected = Array( selected );
							
						}
						loadField( data );				
						
					});
			
				select.insert("option", ":first-child")
					.html( "Select a different " + data.title );
					
				setTimeout( populateSelect, 300 );
				
			}
			
			clearPanel();
			addHeader();
			addOperations();
			addInstructions();
			
			addSelect();
			
		}
		
		function loadFilterByColour( data ) {
			
			function addHeader () {
				
				var header = p.elements.panel.append("ul")
					.attr("class", "header");
					
				header.selectAll("li")
					.data([
						"<a class=\"back\" href=\"#\">Back</a>",
						"<label>" + data.title + "</label>" + data.selected
					])
					.enter()
					.append("li")
					.html( function(d) { return d; });
					
				header.select("a.back")
					.on("click", function() {
						loadField( data );
					});
					
				p.elements.panel.append("h3")
					.html( "Colour" );
			
			}
			
			function addSwatches() {
				
				var colour = [d3.scale.category20(), d3.scale.category20b(), d3.scale.category20c()];
				
				p.elements.panel.append("ul")
					.attr("class", "swatches")
				.selectAll("li")
					.data( d3.range(60) )
				.enter()
					.append("li")
					.style("background-color", function(d) {
						
						return colour[ d % 3 ](d);
						
					})
					.on("click", function( index ) {
					
							if( p.heap ) {
							
								p.data = p.heap.data();
								
								p.data.forEach( function(d) {
									
									if ( doesMatch( d, data ) ) {
										
										d.color = colour[ index % 3 ](index);
										
									}
								
								} );
								
								p.heap.data( p.data ); 
								
								hidePanel();
								
							}			
						
					});
				
			}
			
			clearPanel();
			addHeader();
			addSwatches();
		}
		
		function makePanel() {
			
			showPanel( params );
		
			loadContent ( params.data );	
			
		}
		
		if ( ! params.data.initialise ) {
			
			makePanel();

		} else {
			
			if ( typeof params.data.initialise == "function" ) {
				
				bufferPanel();
				
				params.data.initialise( makePanel );
				
			}
			
		}
		
	}
	
	function clearPanel() {
		
		p.elements.panel.selectAll("*")
			.remove();
		
	}

	function hidePanel() {
		
		p.elements.panel.style("display", "none");

		p.elements.panel.overlay.style("display", "none");
		
	}
	
	function showPanel( params ) {
		
		// Displays panel at the position of the item
		
		p.elements.panel.style({
			"display": "block"
		});	
		
		p.elements.panel.datum( params.data );
		
		p.elements.panel.overlay.style("display", "block");
		
		if( params.event.pageY > p.elements.panel.height / 2) {

			p.elements.panel.style("top", ( params.event.pageY - p.elements.panel.height / 2 - p.styles.panel.pointer.height / 2 ) + "px" );

		} else {
		
			p.elements.panel.style("top", (p.styles.panel.pointer.height / 2 ) + "px" );
			
		}
		
		if( params.event.pageX > p.elements.panel.width + p.styles.panel.pointer.width ) {
			
			p.elements.panel.style("left", ( params.event.pageX - p.elements.panel.width - p.styles.panel.pointer.width) + "px")
				.classed("pointerLeft", true)
				.classed("pointerRight", false);
			
		} else {
			
			p.elements.panel.style("left", ( params.event.pageX + p.styles.panel.pointer.width) + "px")
				.classed("pointerLeft", false)
				.classed("pointerRight", true);
			
		}
		

	}
	
	function populateField( field ) {
	
		field.values = []; 
			
		p.data.forEach( function(d) { 
			
				value = field.accessor.call(field.accessor, d); 
				
				if( toString.call(value) !== "[object Array]" ) {
				
					value = [ value ];
					
				}
				
				value.forEach( function (v) {
					
					if ( v instanceof Object) {
						
						var objectInArray = false;
						
						for(var i = 0; i < field.values.length; i++) {
						
							if( field.values[i] instanceof Object && field.values[i].id === v.id ) {
								objectInArray = true;
								break;
							}
							
						}
						
						if (! objectInArray ) {
							
							field.values.push(v);
							
						}
						
					} else if ( field.values.indexOf( v ) === -1 ) {
						
							field.values.push(v);
							
					}
					
				});
			} );
			
		field.values.sort();
		
	}
	
	function process( params ) {
		
		switch( params.event.type ) {
			
			case "click":
			
				panel( params );
				
				break;
				
			case "dblclick":
			
				if ( params.data && params.data.url ) {
					
					window.open( params.data.url );
					
				}
				
				break;
			
		}
		
	}
	
	// Initialiser
	me.initialise = function() {
				
		function initPanel() {
			
			var container = d3.select("body").append("div")
				.attr("class", "ui_panel_container");
				
			// Add overlay (for closing the panel)
			container.append("div")
				.attr("class", "ui_panel_overlay")
				.style("display", "none")
				.on("click", hidePanel);
				
			p.elements.panel = container.append("div")
				.attr("class", "ui_panel")
				.attr("id", "ui_panel_" + id);
				
			p.elements.panel.overlay = container.select(".ui_panel_overlay");
				
			// Make panel visible before determining width & height
			p.elements.panel.style("display", "block");	
				
			p.elements.panel.width = parseInt( p.elements.panel.style("width") ) ;
			p.elements.panel.height = parseInt( p.elements.panel.style("height") );
			
			p.elements.panel.style("display", "none");
				
				
			// Add pointers
			p.elements.panel.append("div")
				.attr("class", "pointer pointerLeft");
			p.elements.panel.append("div")
				.attr("class", "pointer pointerRight");
				
			
			// Add listener for progress bar
			jQuery( document ).on("loadingProgressed", function ( event, numFetched, numRows ) {
			
				var div = p.elements.panel.select( "div.loading" );
				
				if ( div.empty() ) {
					
					return false;
					
				}
				
					
				var barWidth = function( d ) {
					
					return 100 / d.numRows * d.numFetched + "%";
					
				};
				
				if ( ! div.classed( "progress" ) ) {
					
					div.classed( "progress", true );
					
				}
				
				div.selectAll( "div.bar" )
					.data( [ { numFetched: numFetched, numRows: numRows } ] )
				.enter()
					.append( "div" )
					.attr( "class", "bar" )
					.style( "width", barWidth );
					
				div.selectAll( "div.bar" )	
					.style( "width", barWidth );
				
			
			} );
				
					
		}
		
		initPanel();
		
		initialised = true;
		
		return me;
		
	};
	
	
	// Accessors
	me.heap = function(_) {
		if( !arguments.length ) return p.heap;
		
		var heap = _;
		
		p.heap = heap;
		
		// Link UI to a heap layout
		TT.observer.make( heap );
		heap.addSubscriber( process );
		p.data = heap.data();
		
		// Add heap parent as panel parent
		p.parent = heap.parent();
		TT.observer.make( p.parent );
		p.parent.addSubscriber( process );
	
		return me;
		
	};
	
	me.fields = function(_) {
		if( !arguments.length ) return p.fields;
		p.fields = _;
		
		return me;
	};
	
	me.record = function(_) {
		if( !arguments.length ) return p.record;
		p.record = _;
		
		return me;
	};
	
	return me;
	
};