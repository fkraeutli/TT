/*

Generates heap view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date()

}


*/

TT.heap = function() {
	
	if(!TT.heap.id) TT.heap.id = 0;
	
	var	initialised = false,
		id = TT.heap.id++,
		me = {},
		heap = this,
		nmsp = "hp_" + id,
		zoom;
	
	var p = {
		
		axis: {},
		
		data: [],
		
		elements: {
			
		},
		
		format: {
			
			year: d3.time.format("%Y"),
			date: d3.time.format("%d %b %Y")
			
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
		
		scales: {
			
			minMax: {
				
				// Update zoom extent here
				
				zoom: d3.scale.linear()
					.domain( [0.5, 240] ) 
					.range( [0, 1] )
				
			}
			
		},
		
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
		
		view: {
			
			from: new Date( 1900 , 0, 1 ),
			to: new Date( 2000 , 0, 1 ),
			
			width: 800,
			height: 600,
			
			padding: 40
			
		},
		zoom: {
			factor: 1
		}	
	};
	
	// REMOVE
	test_heap_p  = p;
	
	var attr = {
		
		axis: {
		
			tickFormat: function (d) {
				if( Math.round( (p.axis.scale().domain()[1].getFullYear() - p.axis.scale().domain()[0].getFullYear()) / p.axis.ticks()) >= 1 ) { // If there is not more than one tick per year represented
					return p.format.year(d);
				} else {
					return p.format.date(d);
				}
			}
			
		},
		
		event: {
			
			circle: {
				
				cx: -p.styles.events.diameter / 2,
				
				cy: -p.styles.events.diameter / 2,
				
				fill: function (d) {
					return d.color || null;	
				},
			
				r: function() { return Math.min(10, p.zoom.factor) * p.styles.events.diameter / 2; }
				
			},
			
			transform: function (d)  {
			
				return "translate(" + x(d[nmsp].x) + "," + y(d[nmsp].y) + ")";
				
			}
			
		}

	};
			
	// Init scales used for panning and zooming
	var x, y;
	
	// Private functions
	
	function doZoom() {
		
		if(d3.event)
			p.zoom.factor = d3.event.scale;
		
		var ax = p.svg.select(".heap_axis");
		
		p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] );
		
		update();
		
		ax.call(p.axis);
		
	}
	
	function update() {		
	
		function createEventsAppearance(events) {
			
			// Circle
			events.append("circle")
				.attr("class", "eventCircle")
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
		
			return x(d[nmsp].x)  >= 0 &&
				x(d[nmsp].x) <= p.view.width &&
				y(d[nmsp].y) > -p.styles.events.diameter && 
				y(d[nmsp].y) < p.view.height;
				
		}
		
		function updateDataValues() {
		
			if (p.grid.initialised) return false;
					
			function makeGrid() {
				
				p.grid.availableWidth = p.scales.dateToPx(p.view.to) - p.scales.dateToPx(p.view.from);
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
				
				d[nmsp].x = p.scales.dateToPx( d[nmsp].col * p.grid.resolution + p.view.from.valueOf() );
				
				var displace = p.grid.table[ d[nmsp].col ].length * p.styles.events.diameter / 2  + p.view.height / 2 ;
				d[nmsp].y = -d[nmsp].row * p.styles.events.diameter + displace - displace % p.styles.events.diameter;
				
			});
			
			p.grid.initialised = true;
		}
		
		function updateEventsAppearance(events) {
		
			events.select("circle.eventCircle")
				.attr("r", attr.event.circle.r)
				.style("fill", attr.event.circle.fill);
						
		}		
		
		function updateEventsImages(events) {
			
			if(p.zoom.factor > p.thresholds.images) {
				
				events.filter(function(d) { return !d.hasImage && d.thumbnailUrl; }).append("image")
					.attr("xlink:href", function(d) {
						d.hasImage = true;
						return d.thumbnailUrl;
					});
					
				events.selectAll("image")
					.attr("x", -p.zoom.factor / 2 * p.styles.images.factor)
					.attr("y", -p.zoom.factor / 2 * p.styles.images.factor)
					.attr("width", p.zoom.factor * p.styles.images.factor + "px")
					.attr("height", p.zoom.factor * p.styles.images.factor + "px");
				
			} else {
			
				events.selectAll("image").remove();
				events.each( function(d) { d.hasImage = false; } );
				
			}
			
		}
		
		if ( !initialised ) return false;
	
		updateDataValues();
		
		// Draw events
		var eventData = p.data.filter(filterEvents);
		
		// Draw no events if too many would be visible
		if(eventData.length > p.thresholds.display) {
			eventData = [];
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
			.on("click", function(d) { console.log(d); })
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
					path.push( "L", x( d[ d.length-1 ][nmsp].x ), ",", y( d[ d.length-1 ][nmsp].y ) );	
					path.unshift( "L", x( d[ 0 ][nmsp].x ), ",", y( d[ 0 ][nmsp].y ) );	
				}
				
			}
			path.unshift( "M", path[1], ",", path[3] );
			path.push("Z");
			
			return path.join("");
			
		})
		.attr("display", function() {
			
			return eventData.length > 0 ? "none" : "";
			
		});
	
	}
	
	function updateMinMax() {
		
		if(p.data) {
			var minFrom = d3.min( p.data, function(d) { return d.from; } ),
				maxTo = d3.max( p.data, function(d) { return d.to; } );
					
			p.view.from = minFrom;//new Date( minFrom.valueOf() - 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );
			p.view.to = maxTo;//new Date( maxTo.valueOf() + 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );
		}
	}


	// Initialiser
	me.apply = function () {
		
		function initHeap() {
			
			function initAxis() {
			
				p.scales.axis = d3.time.scale()
					.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] )
					.range( [0, p.view.width] );
				
				p.axis = d3.svg.axis()
					.scale(p.scales.axis)
					.tickSize(p.view.height - p.view.padding)
					.tickFormat(attr.axis.tickFormat)
					.orient("top");
					
				p.elements.axis = p.svg.append("g")
					.attr("class", "heap_axis")
					.attr("id","hs" + id + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
					
			}
			
			function initEvents() {
			
				p.elements.outline = p.svg.insert("g")
					.attr("class", "heap_outline")
					.attr("id", "hs" + id + "_outline")
					.append("path");
					
				p.elements.events = p.svg.insert("g")
					.attr("class", "heap_events")
					.attr("id", "hs" + id + "_events");
					
			}
				
			function initScales() {
			
			
				x = d3.scale.linear()
					.domain([0, p.view.width])
					.range([0, p.view.width ]);
				
				y = d3.scale.linear()
					.domain([0, p.view.height])
					.range([0, p.view.height]);
					

			
				p.scales.dateToPx = d3.scale.linear()
					.domain( [ p.view.from.valueOf(), p.view.to.valueOf() ] )
					.range( [ p.view.padding, p.view.width - p.view.padding ] );
					
				p.scales.pxToDate = d3.scale.linear()
					.domain( [ p.view.padding, p.view.width - p.view.padding ] )
					.range( [ p.view.from.valueOf(), p.view.to.valueOf() ] );
					
			}	
			
			function initZoom() {						
				
				zoom = d3.behavior.zoom()
					.x(x)
					.y(y)
					.scaleExtent( p.scales.minMax.zoom.domain() );
									
				p.svg.select(".heap_events").insert("rect",":first-child")
					.attr("width", p.view.width)
					.attr("height", p.view.height)
					.attr("class","overlay");
					
				p.svg.select(".heap_events").call( zoom.on("zoom", doZoom) );
				
			}
			
							
			initScales();
			initEvents();
			initAxis();
			initZoom();	
			
		}
		
		// Update parameters
		
		p.svg = arguments[0];

		p.view.width = +p.svg.attr("width");
		p.view.height = +p.svg.attr("height");
		
		console.log(p.view);
		
		updateMinMax();
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
		
		updateMinMax();
		
		if(initialised) {
			update();
		}
		
		return me;
	};
	
	me.update = function() {
		doZoom();
	};
	
	// Linking accessors	
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
	
	return me;
	
};