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
		
		function loadContent( data ) {
		
			function addHeader() {
						
				// Add header
				var header = p.elements.panel.append("div")
					.attr("class", "header")
					.style("background-image", "url(" + p.record.image.call( p.record.image, data ) + ")" );
					
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
						return "<label>" + d.title + "</label>" + d.accessor( data ); 
					} )
					.on( "click", function(d) {
						d.selected = d.accessor( data );
						loadField( d );
					});
				
			}
			
			clearPanel();
			
			addHeader();
			addList();
		}	
		
		function loadField(data) {
			
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
						description: "Colour all the items matching " + data.title + " \"" +  data.selected + "\""
					}, 
					{
						title: "Duplicate",
						description: "Create a new heap with the items matching " + data.title + " \"" +  data.selected + "\""
					}, 
					/*{
						title: "Separate",
						description: "Separate all items matching " + data.title + " \"" +  data.selected + "\" from their current heap"
					},*/
					{
						title: "Remove",
						description: "Remove all items matching " + data.title + " \"" +  data.selected + "\""
					}
				];
				
				operations.selectAll("li").data(buttons)
					.enter()
					.append("li")
					.html( function(d) { 
						
						return "<a class=\"button\" href=\"#\">" + d.title + "</a><p class=\"description\">" + d.description + "</p>";
						
					});
					
				
				
			} 
			
			function addSelect() {
				
				var select = p.elements.panel.append("select")
					.attr("class", "select")
					.on("change", function(d) {
						
						var selected = this.options[this.selectedIndex].__data__ ;
						data.selected = selected;
						loadField( data );				
						
					});
					
				select.selectAll("option")
					.data( data.values )
				.enter()
					.append("option")
					.html(function(d) { return d; });
					
				select.insert("option", ":first-child")
					.html( "Select a different " + data.title );
			}
			
			clearPanel();
			addHeader();
			addOperations();
			addInstructions();
			addSelect();
			
		}
			
		showPanel( params );
		loadContent ( params.data );
		
	}
	
	function clearPanel() {
		
		p.elements.panel.selectAll("*").remove();
		
	}

	function hidePanel() {
		
		p.elements.panel.style("display", "none");

		p.elements.panel.overlay.style("display", "none");
		
	}
	
	function showPanel( params ) {
		
		p.elements.panel.style("display", "block");	
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
		
		function initFields() {
		
			fields.forEach( function(field) { 
			
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
							
							if (!objectInArray) {
								
								field.values.push(v);
								
							}
							
						} else if ( field.values.indexOf( v ) === -1 ) {
							
								field.values.push(v);
								
						}
						
					});
				} );
				
				field.values.sort();
				
			} );
			
		}
		
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
				
					
		}
		
		initFields();
		initPanel();
		
		initialised = true;
		
		return me;
		
	};
	
	
	// Accessors
	me.heap = function(_) {
		if( !arguments.length ) return p.heap;
		
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