/*

Generates heap view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date()

}


*/

TT.layout.heap = function() {
	
	if(!TT.layout.heap.id) TT.layout.heap.id = 0;
	
	var	initialised = false,
		id = TT.layout.heap.id++,
		me = {},
		heap = this,
		nmsp = "hp_" + id,
		x,
		y,
		zoom;
	
	var p = {
		
		data: [],
		
		elements: {
			
		},
				
		grid: {
			
			availableWidth: null,
			maxRow: 0,
			numCols: null,
			initialised: false,
			range: null,
			resolution: null,
			table: []
			
		},
		
		parent: false,
		
		styles: {
			
			events: {
				diameter: 1
			},
			
			images: {
				factor: 1
			}
		},
		
		thresholds: {
			
			display: 2000, // amount of events
			images: 30 // zoom factor
			
		},
		
		translate: [0, 0],
		
		view: {}
	};
	
	// REMOVE
	test_heap_p  = p;
	
	var attr = {
		
		event: {
			
			circle: {
				
				cx: -p.styles.events.diameter / 2,
				
				cy: -p.styles.events.diameter / 2,
				
				fill: function (d) {
					return d.color || null;	
				},
			
				r: function() { return Math.min( 10, zoom.scale()) * p.styles.events.diameter / 2; }
				
			},
			
			transform: function (d)  {
			
				return "translate(" + _x(d[nmsp].x) + "," + _y(d[nmsp].y) + ")";
				
			}
			
		}

	};		
		
	function update() {		
	
		function computeDisplaceForColumn( column ) {
			
			return p.grid.table[ column ].length * p.styles.events.diameter / 2  + p.view.height / 2 ;
			
		}
		
		function computeGridXForColumn( column ) {
			
			return p.scales.dateToPx( column * p.grid.resolution + p.view.from.valueOf() );
			
		}
		
		function createEventsAppearance(events) {
			
			// Circle
			events.append("circle")
				.attr("class", "event_circle")
				.attr("cx", attr.event.circle.cx)
				.attr("cy", attr.event.circle.cy)
				.attr("r", attr.event.circle.r)
				.style("fill", attr.event.circle.fill);
				
		}
		
		function filterEvents(d) { 

			/*
			
			Remove data
			- If the item is completely outside of the viewable area
			
			*/
		
			return _x(d[nmsp].x)  >= 0 &&
				_x(d[nmsp].x) <= p.view.width &&
				_y(d[nmsp].y) > -p.styles.events.diameter && 
				_y(d[nmsp].y) < p.view.height;
				
		}
		
		function updateDataValues() {
		
			if (p.grid.initialised) return false;
					
			function makeGrid() {
				
				p.grid.availableWidth = p.scales.dateToPx( p.view.to ) - p.scales.dateToPx( p.view.from );
				p.grid.numCols = Math.floor( p.grid.availableWidth / p.styles.events.diameter );
					
				p.grid.range = p.view.to - p.view.from;
				p.grid.resolution = p.grid.range / p.grid.numCols;
				
				p.grid.table = [];
				
				for( var i = 0; i < p.grid.numCols; i++ ) {
					
					p.grid.table[i] = Array();
					
				}
				
				p.grid.maxRow = 0;
						
				// Set initial parameters
				p.data.forEach( function(d) {
					
					// Select initial column and row
					d[nmsp].col = d[nmsp].initCol = Math.min( Math.floor( ( (d.from.valueOf() + ( d.to.valueOf() - d.from.valueOf() ) / 2) - p.view.from.valueOf() ) / p.grid.resolution ), p.grid.numCols - 1);		

					// Define tolerance columns based on from/to dates;
					d[nmsp].minCol = Math.max( Math.floor( ( d.from.valueOf() - p.view.from.valueOf() ) / p.grid.resolution ), 0); // Lowest possible column or zero
					d[nmsp].maxCol = Math.min( Math.ceil( ( d.to.valueOf() - p.view.from.valueOf() ) / p.grid.resolution ), p.grid.numCols - 1); // Highest possible column or maxiumum
					
					// Generate array for candidate column selection
					d[nmsp].candidateCols = d3.range( d[nmsp].initCol, d[nmsp].minCol - 1, -1 ).concat( d3.range( d[nmsp].initCol + 1, d[nmsp].maxCol + 1 ) );
				
					// Add item to row smallest row
					var minRow = p.grid.maxRow;
					
					for( var i = 0; i < d[nmsp].candidateCols.length; i++ ) {	
					
						if ( p.grid.table[ d[nmsp].candidateCols[i] ].length  < minRow) {
						
							d[nmsp].col = d[nmsp].candidateCols[i];
							minRow = p.grid.table[ d[nmsp].candidateCols[i] ].length;
							
						}
						
					}
					d[nmsp].row = minRow;
					
					// Add to grid
					
					p.grid.table[ d[nmsp].col ][ d[nmsp].row ] = d;
					
					if (minRow == p.grid.maxRow) {
					
						p.grid.maxRow++;
						
					}

				} );
				
				
			}
		
			// Initialise heap grid
			makeGrid();	
			
			// Translate columns and rows to x,y coordinates
			p.data.forEach( function(d) {
				
				d[nmsp].x = computeGridXForColumn( d[nmsp].col ); 
				
				var displace = computeDisplaceForColumn( d[nmsp].col );
				d[nmsp].y = -d[nmsp].row * p.styles.events.diameter + displace - displace % p.styles.events.diameter;
				
			});
			
			p.grid.initialised = true;
		}
		
		function updateEventsAppearance(events) {
		
			events.select("circle.event_circle")
				.attr("r", attr.event.circle.r)
				.style("fill", attr.event.circle.fill);
						
		}		
		
		function updateEventsImages(events) {
			
			if(zoom.scale() > p.thresholds.images) {
				
				var imagesEnter = events.filter(function(d) { return !d.hasImage && d.thumbnailUrl; });
				
				imagesEnter.append("image")
						.attr("xlink:href", function(d) {
						
							d3.select("#hs" + id + "_event_" + d.id + " image").on("error", function(event) {
								d3.select(this).style("display", "none");
							});
						
							d.hasImage = true;
							return d.thumbnailUrl;
						});
				
					
				events.selectAll("image")
					.attr("x", -zoom.scale() / 2 * p.styles.images.factor)
					.attr("y", -zoom.scale() / 2 * p.styles.images.factor)
					.attr("width", zoom.scale() * p.styles.images.factor + "px")
					.attr("height", zoom.scale() * p.styles.images.factor + "px");
					
				
			} else {
			
				events.selectAll("image").remove();
				events.each( function(d) { d.hasImage = false; } );
				
			}
			
		}
		
		if ( !initialised ) return false;
	
		updateDataValues();
		
		// Draw events
		var eventData = p.data.filter(filterEvents);
		var drawOutline = false;
		
		// Draw no events if too many would be visible
		if(eventData.length > p.thresholds.display) {
		
			drawOutline = true;
		
			eventData = eventData.filter( function(d) {
				
				return d.color;
				
			});
		}
		
		var events = p.elements.events.selectAll("g.heap_event")
			.data( eventData, function(d) {return d.id;} );
		
		// Add new events
		var eventsEnter = events.enter()
			.append("g")
			.attr("id", function(d) {
					return "hs" + id + "_event_" + d.id;
				})
			.attr("class", "heap_event")
			.attr("transform", attr.event.transform)
			.on("click", function(d) { 
				if( me.hasOwnProperty("publish") ) {	
		
					me.publish( {data: d, event: d3.event} );
					
				}
			})
			.on("dblclick", function(d) { 
				if( me.hasOwnProperty("publish") ) {	
		
					me.publish( {data: d, event: d3.event} );
					
				}
			})
			.each(function(d) { d.hasImage = false; } );
			
		// Add event appearance
		createEventsAppearance( eventsEnter );
		
		// Update events
		events.attr("transform", attr.event.transform);
		
		// Update event appearance
		updateEventsAppearance(events);
		
		// Remove events
		events.exit().remove();
		
		// Add or update images
		updateEventsImages(events);
		
		// Draw outline
		p.elements.outline.attr("d", function() {

			var path = [],
				i = -1,
				n = p.grid.table.length,
				d;
				
			// Generate path part per value				
			while (++i < n) {
				
				d = p.grid.table[i];
				
				if( d.length > 0) {
					
					//path.push( "S", _x( d[ d.length-1 ][nmsp].x - p.styles.events.diameter/2 ), ",", _y( d[ d.length-1 ][nmsp].y ), " ", _x( d[ d.length-1 ][nmsp].x ), ",", _y( d[ d.length-1 ][nmsp].y ) );	
					//path.unshift( "S", _x( d[ 0 ][nmsp].x + p.styles.events.diameter/2 ), ",", _y( d[ 0 ][nmsp].y ) , " " , _x( d[ 0 ][nmsp].x ), ",", _y( d[ 0 ][nmsp].y ) ); 
					
					path.push( "L", _x( d[ d.length-1 ][nmsp].x ), ",", _y( d[ d.length-1 ][nmsp].y  - p.styles.events.diameter / 2 ) );	
					path.unshift( "L", _x( d[ 0 ][nmsp].x ), ",", _y( d[ 0 ][nmsp].y ) +  p.styles.events.diameter / 2 ); 
					
				} else {
					
					// add point in middle
					var centX = computeGridXForColumn( i );
					var centY = computeDisplaceForColumn( i );
					
					path.push( "L", _x( centX ), ",", _y( centY ) );
					path.unshift( "L", _x( centX ), ",", _y( centY ) );
					
				}
				
			}
			path.unshift( "M", path[1], ",", path[3] );
			path.push("Z");
			
			return path.join("");
			
		})
		.attr("display", function() {
			
			return drawOutline ? "" : "none";
			
		});
	
	}
	
	function _x( value ) {
		
		return x(value) + zoom.scale() * p.translate[0];
		
	}
	
	function _y( value ) {
		
		return y(value) + zoom.scale() * p.translate[1];
		
	}

	// Initialiser
	me.apply = function () {
		
		function initHeap() {
						
			function initEvents() {
			
				p.elements.outline = p.svg.insert("g")
					.attr("class", "heap_outline")
					.attr("id", "hs" + id + "_outline")
					.append("path")
					.on("click", function(d) { 
						if( me.hasOwnProperty("publish") ) {	
		
							var event = d3.event;
		
							// Determine Column					
							var dateClicked = new Date( p.scales.pxToDate( event.x + x.domain()[0] ) ),
								offset =  dateClicked.valueOf() - p.view.from.valueOf(),
								col = Math.floor(offset / p.grid.resolution);
							
							// Determine Row
							var displace = p.grid.table[ col ].length * p.styles.events.diameter / 2  + p.view.height / 2 ,
								yClicked = event.y + y.domain()[0],
								row = Math.floor(( displace - yClicked) / zoom.scale() * p.styles.events.diameter );
							
							// FIXME: column and row incorrectly determined after zooming (panning works)
							
							console.log(col + "," + row);
	
							me.publish( {data: p.grid.table[ col ][ row ], event: d3.event} );
					
						}
					});
					
				p.elements.events = p.svg.insert("g")
					.attr("class", "heap_events")
					.attr("id", "hs" + id + "_events");
					
			}
				
			initEvents();
			
		}
		
		initHeap();
		
		initialised = true;
		
		update();
		
	};

	// Accessors
	me.data = function(_) {
		if( !arguments.length ) return p.data;
		p.data = _;
		
		p.data.forEach( function(d) {
			if( !d.hasOwnProperty(nmsp) ) {
				d[nmsp] = {};
			}
		});
		
		p.grid.initialised = false;
		
		if(initialised) {
		
			var minFrom = d3.min( p.data, function(d) { return d.from; } );
			var maxTo = d3.max( p.data, function(d) { return d.to; } );
			
			if( minFrom < p.view.from ) {
				
				parent.from( minFrom);
				
			}
			
			if (maxTo > p.view.to ) {
			
				parent.to( maxTo );
				
			}
		
			update();
		}
		
		return me;
	};
	
	me.identifier = function() {

		return nmsp;
		
	};
	
	me.initialise = function() {
		
		p.svg.call(me);
		
		return me;
		
	};
	
	me.scales = function(_) {
		
		if( !arguments.length ) return p.scales;
		p.scales = _;
		
		return me;
		
	};
	
	me.styles = {};
	
	me.styles.events = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.styles.events[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.styles.events[i] = name[i];
				}
				
			}
		
		} else {
			
			p.styles.events[name] = value;
		}
		
		p.grid.initialised = false;
		update();
		
		return me;
		
	};
	
		
	me.styles.images = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.styles.images[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.styles.images[i] = name[i];
				}
				
			}
		
		} else {
			
			p.styles.images[name] = value;
		}
		
		p.grid.initialised = false;
		update();
		
		return me;
		
	};
	
	me.svg = function(_) {
		
		if( !arguments.length ) return p.svg;
		p.svg = _;
		
		return me;
		
	};
	
	me.parent = function(_) {
		
		if( !arguments.length ) return p.parent;
		p.parent = _;
		
		return me;
		
	};
	
	me.threshold = function(name, value) {
		
		if (arguments.length < 2) {
		
			if(typeof name === "string") {
				return p.thresholds[name];
			} else if (typeof name === "object") {
			
				for(var i in name) {				
					p.thresholds[i] = name[i];
				}
				
			}
		
		} else {
			
			p.thresholds[name] = value;
		}
		
		update();
		
		return me;
		
	};
	
	me.update = function() {

		update();
		
		return me;
		
	};
	
	me.refresh = function() {
		
		p.grid.initialised = false;
		update();
		
		return me;
		
	};
	
	me.view = function(_) {
		
		if( !arguments.length ) return p.view;
		p.view = _;
		
		return me;
		
	};
	
	me.x = function(_) {
		
		if( !arguments.length ) return x;
		x = _;
		
		return me;
		
	};
	
	me.y = function(_) {
		
		if( !arguments.length ) return y;
		y = _;
		
		return me;
		
	};
	
	me.zoom = function(_) {
		
		if( !arguments.length ) return zoom;
		zoom = _;
		
		return me;
		
	};
	
	return me;
	
};