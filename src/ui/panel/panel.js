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
		
		styles: {

		},
		
		view: {}
	};
	
	
	function process( params ) {
		
		if ( params.event.type == "dblclick" && params.data.url ) {
			
			window.open( params.data.url );
			
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
			} );
			
		}
		
		initFields();
		
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
	
		return me;
		
	};
	
	me.fields = function(_) {
		if( !arguments.length ) return p.fields;
		p.fields = _;
		
		return me;
	};
	
	return me;
	
};