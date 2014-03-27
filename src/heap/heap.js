/*

Generates heap view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date(),
	title: "",
	weight: #

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
			numCols: null,
			numRows: 1,
			initialised: false,
			range: null,
			resolution: null,
			table: []
			
		},
		
		scales: {
			
			minMax: {
				
				// Update zoom extent here
				
				zoom: d3.scale.linear()
					.domain( [0.01, 120] ) 
					.range( [0, 1] )
				
			}
			
		},
		
		styles: {
			
			events: {
				diameter: 2
			}
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
			
				r: function() { return Math.min(3, p.zoom.factor) * p.styles.events.diameter / 2; }
				
			},
			
			transform: function (d)  {
				return "translate(" + x(d[nmsp].x) + "," + y(d[nmsp].y) + ")";
			}
			
		}

	};
			
	// Init scales used for panning and zooming
	var x = d3.scale.linear()
		.domain([0, p.view.width])
		.range([0, p.view.width ]);
	
	var y = d3.scale.linear()
		.domain([0, p.view.height])
		.range([0, p.view.height]);
		
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
		
			function buildHeap() {
				
				function arrangeItem(d) {
					
					// If the item is the only one in its cell we don't need to do anything
					if ( p.grid.table[ d[nmsp].col ][ d[nmsp].row ].length <= 1 ) {
						return false;
					}
					
					// Select the column one row above the item 
					var minCol = d[nmsp].initCol,
						minRow = d[nmsp].row + 1;
						
					// Increase grid rows if necessary
					if( p.grid.numRows <= minRow) {
					
						for( var gridCol = 0; gridCol < p.grid.numCols; gridCol++ ) {
					
							p.grid.table[gridCol][p.grid.numRows] = Array();
							
						}
						
						p.grid.numRows++;
					}
					
					var	minItems = p.grid.table[ minCol ][ minRow ].length;
					
					// Examine other candidate columns on current row		
					for (var i = d[nmsp].minCol; i < d[nmsp].maxCol; i++) {
						
						if(minItems === 0) {
							break;
						}
						
						// Select other candidate if number of items is minimal
						if (p.grid.table[ i ][ d[nmsp].row ].length < minItems && d[nmsp].trace.indexOf( parseFloat( i + "." + d[nmsp].row) ) == -1) {
							
							minItems = p.grid.table[ i ][ d[nmsp].row ].length;
							minCol = i;
							minRow = d[nmsp].row;
							
						}
						
					}
					
					// Reposition item in grid
					for (var j = 0; j < p.grid.table[ d[nmsp].col ][ d[nmsp].row ].length; j++ ) {
						
						if( p.grid.table[ d[nmsp].col ][ d[nmsp].row ][ j ] == d) {
							p.grid.table[ d[nmsp].col ][ d[nmsp].row ].splice( j, 1 );
							break;
						}
						
					}
					
					d[nmsp].col = minCol;
					d[nmsp].row = minRow;					
					// Keep track of visited cells
					d[nmsp].trace.push( parseFloat( d[nmsp].col + "." + d[nmsp].row) );
					
					p.grid.table[ d[nmsp].col ][ d[nmsp].row ].push( d );
					
				}
				
				function gridIsPerfect() {
					
					for ( var col = 0; col < p.grid.table.length; col++ ) {
						for (var row = 0; row < p.grid.table[col].length; row++ ) {
							if ( p.grid.table[ col ][ row ].length > 1) {
								return false;
							}
						}
					}
					
					return true;
					
				}
				
				var exec = 0,
					maxExec = 0.1 * p.data.length;
					
				while( !gridIsPerfect() && exec < maxExec) {
					
					p.data.forEach(arrangeItem);
					exec++;
					
				}
			}
					
			function initGrid() {
				
				p.grid.availableWidth = p.view.width;
				p.grid.numCols = Math.floor( p.grid.availableWidth / p.styles.events.diameter );
					
				p.grid.range = p.view.to - p.view.from;
				p.grid.resolution = p.grid.range / p.grid.numCols;
				
				p.grid.colWidth = p.grid.availableWidth / ( p.grid.range / p.grid.resolution );
				
				p.grid.table = [];
				
				for( var i = 0; i < p.grid.numCols; i++ ) {
					
					p.grid.table[i] = Array();
					p.grid.table[i][0] = Array();
					
				}
				
				p.grid.numRows = 1;
						
				// Set initial parameters
				p.data.forEach( function(d) {
					
					// Initialise trace which keeps track of where the item has been
					d[nmsp].trace = Array();
					
					// Select initial column and row
					d[nmsp].col = d[nmsp].initCol = Math.floor( ( (d.from.valueOf() + ( d.to.valueOf() - d.from.valueOf() ) / 2) - p.view.from.valueOf() ) / p.grid.resolution );
					d[nmsp].row = 0;
					d[nmsp].trace.push( parseFloat( d[nmsp].col + "." + d[nmsp].row) );
					
					// Define tolerance columns based on from/to dates;
					d[nmsp].minCol = Math.max( Math.floor( ( d.from.valueOf() - p.view.from.valueOf() ) / p.grid.resolution ), 0); // Lowest possible column or zero
					d[nmsp].maxCol = Math.min( Math.ceil( ( d.to.valueOf() - p.view.from.valueOf() ) / p.grid.resolution ), p.grid.numCols); // Highest possible column or maxiumum
					
					// Add to grid
					p.grid.table[ d[nmsp].col ][ d[nmsp].row ].push(d);
				} );
				
			}
		
			// Initialise heap grid
			initGrid();	
			
			//Run heap building algorithm
			buildHeap();
			
			// Translate columns and rows to x,y coordinates
			p.data.forEach( function(d) {
				
				d[nmsp].x = d[nmsp].col * p.grid.colWidth;
				d[nmsp].y = -d[nmsp].row * p.styles.events.diameter + p.view.height - p.view.padding;
				
				if (d[nmsp].row % 2) {
					d[nmsp].x += p.styles.events.diameter / 2;
				}
				
			});
			
			p.grid.initialised = true;
		}
		
		function updateEventsAppearance(events) {
		
			events.select("circle.eventCircle")
				.attr("r", attr.event.circle.r)
				.style("fill", attr.event.circle.fill);
			
		}		
		
		if ( !initialised ) return false;
	
		updateDataValues();
		
		var events = p.elements.events.selectAll("g.heap_event")
			.data( p.data.filter(filterEvents), function(d) {return d.id;} );
			
		// Update events
		events.attr("transform", attr.event.transform);
		
		// Update event appearance
		updateEventsAppearance(events);
		
		// Add new events
		var eventsEnter = events.enter()
			.append("g")
			.attr("id", function(d) {
					return "hp" + id + "_event_" + d.id;
				})
			.attr("class", "heap_event")
			.attr("transform", attr.event.transform);
			
		// Add event appearance
		createEventsAppearance( eventsEnter );
		
		// Remove events
		events.exit().remove();
	
	}
	
	function updateMinMax() {
		
		// Updates the scales used for semantic zooming
		//p.scales.minMax.works.domain([ d3.min( p.data, function(d) {return d.weight ? d.weight : 0;} ), Math.min(300, d3.max( p.data, function(d) {return d.weight ? d.weight : 0;} )) ]);
		
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
					.attr("id","hp" + id + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
					
			}
			
			function initEvents() {
			
				p.elements.events = p.svg.insert("g")
					.attr("class", "heap_events")
					.attr("id", "hp" + id + "_events");
					
			}
				
			function initScales() {
			
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
		
		if(p.data) {
			
			// Initialise visible range with 20% buffer
			
			var minFrom = d3.min( p.data, function(d) { return d.from; } ),
				maxTo = d3.max( p.data, function(d) { return d.to; } );
				
			p.view.from = new Date( minFrom.valueOf() - 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );//d3.min( p.data, function(d) { return d.from; } );
			p.view.to = new Date( maxTo.valueOf() + 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );//d3.max( p.data, function(d) { return d.to; } );
			
		}
		
		initHeap();
		
		initialised = true;
		
		updateMinMax();
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
		
		//p.grid.initialised = false;
		
		updateMinMax();
		update();
		
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