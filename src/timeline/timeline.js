/*

Generates Timeline view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date(),
	title: "",
	weight: #

}


*/

TT.timeline = function() {
	
	if(!TT.timeline.id) TT.timeline.id = 0;
	
	var	initialised = false,
		id = TT.timeline.id++,
		nmsp = "tl_" + id,
		me = {},
		timeline = this,
		zoom;
		
	var p = {
		
		axis: {},
		
		data: [],
		
		elements: {},
		
		format: {
			
			year: d3.time.format("%Y"),
			date: d3.time.format("%d %b %Y")
			
		},
		
		scales: {
			
			minMax: {
				
				// Used for semantic zooming
				
				weight: d3.scale.linear()
					.domain( [0, 1] )
					.range( [0, 1] ),
					
				works: d3.scale.linear()
					.domain([0, 1])
					.range([0, 1]),
				
				// Update zoom extent here
				
				zoom: d3.scale.linear()
					.domain( [0.01, 120] ) 
					.range( [0, 1] )
				
			}
			
		},
		
		styles: {
			
			events: {
				height: 12,
				collapsedHeight: 2,
				fontSize: 12,
				margin: 1,
				collapsedMargin: 1,
				padding: 2
			}
		},
		
		thresholds: {
			
			collapse: 0.6,
			display: 0.2	
			
		},
		
		view: {
			
			from: new Date( 1900 , 0, 1 ),
			to: new Date( 2000 , 0, 1 ),
			
			width: 800,
			height: 600,
			padding: 40,
			
			ys: [0]
			
		},
		
		zoom: {
			factor: 1	
		}
		
		
	};
	
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
		
			rect: {
			
				fill: function (d) {
					return d.color || null;	
				},
			
				height: function (d) {
						return Math.min(d[nmsp].height * p.zoom.factor, d[nmsp].height) + "px";	
				},
				
				width: function (d) {
				
					return (d[nmsp].width * p.zoom.factor) + "px";
					
				}
			},
			
			text: {
			
				anchor: function (d) {		
					return p.zoom.factor >= p.thresholds.collapse && d[nmsp].width * p.zoom.factor > d.title.length * p.styles.events.fontSize ? "start" : "end";	
				},
				
				display: function (d) {
					return d[nmsp].renderLevel > p.thresholds.collapse ? "block" : "none";	
				},
				
				fontSize: p.styles.events.fontSize + "px",
				
				x: function (d) {
					return (d[nmsp].width * p.zoom.factor > d.title.length * p.styles.events.fontSize) ? (x(d[nmsp].x) < 0 && x(d[nmsp].x) + d[nmsp].width * p.zoom.factor > 0 ? p.styles.events.padding + -1*x(d[nmsp].x) : p.styles.events.padding) : -p.styles.events.padding;
				},
				
				y: p.styles.events.height * 0.75
			},
			
			transform: function (d)  {
				return "translate(" + x(d[nmsp].x) + "," + (d[nmsp].y + y(0)) + ")";
			}
		},

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
		
		p.zoom.factor = d3.event.scale;
		
		var events = p.elements.events.selectAll("g.timeline_event");
		var ax = p.svg.select(".timeline_axis");
		
		p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] );
		
		update();
		
		ax.call(p.axis);
		
	}
	
	function update() {
		
		function createEventsAppearance(events) {
			
			// Rectangle
			events.append("rect")
				.attr("class", "eventRect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height", attr.event.rect.height)
				.attr("width", attr.event.rect.width)
				.style("fill", attr.event.rect.fill);
					
			// Add event text
			events.append("text")
				.attr("class", "title")
				.text( function(d) { return d.title; } )
				.attr("x", attr.event.text.x)
				.attr("y", attr.event.text.y)
				.attr("text-anchor", attr.event.text.anchor)
				.attr("display", attr.event.text.display);
				
		}
		
		function filterEvents(d) { 
		
			/*
			
			Remove data
			- If the render level is below the display level
			- If the item is completely outside of the viewable area
			
			*/
		
			return d[nmsp].renderLevel >= p.thresholds.display  &&
				x(d[nmsp].x) + d[nmsp].width * p.zoom.factor >= 0 &&
				x(d[nmsp].x) <= p.view.width &&
				d[nmsp].y + y(0) > -p.styles.events.height && 
				d[nmsp].y + y(0) < p.view.height;
				
		}
				
		function updateDataValues() {
				
			function computeRenderLevel(data, attribute) {
				
				if(data.weight) {
					return Math.pow( p.scales.minMax.works(data.weight), 0.02 / p.scales.minMax.zoom(p.zoom.factor) ) + p.scales.minMax.zoom(p.zoom.factor); 
				} else {
					return 0;
				}
		
			}

			p.data.forEach(function(d) {
				
				d[nmsp].renderLevel = computeRenderLevel(d);
					
			});
			
			// If only one item is visible or all have the same level they should automatically get displayed
			
			if( p.data.length == 1 || d3.min( p.data, function(d) {return d[nmsp].renderLevel;} ) == d3.max( p.data, function(d) {return d[nmsp].renderLevel;} ) ) {
			
				p.data.forEach( function(d) {
					d[nmsp].renderLevel = 1;		
				} );
			
			}				
			
			var count = 0;
			
			p.data.forEach(function(d) {	
			
				if( d[nmsp].renderLevel > p.thresholds.display ) {
				
					d[nmsp].x = p.scales.dateToPx(d.from.valueOf());
					d[nmsp].width = ( p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()) );
					
					d[nmsp].height = d[nmsp].renderLevel < p.thresholds.collapse ? p.styles.events.collapsedHeight : p.styles.events.height;
					d[nmsp].margin = d[nmsp].renderLevel < p.thresholds.collapse ? p.styles.events.collapsedMargin : p.styles.events.margin;
					
					if(count === 0) {
					
						d[nmsp].y = p.view.padding;
						
					} else {
					
						d[nmsp].y = p.view.ys[count - 1] + d[nmsp].margin;
						
					}
					
					p.view.ys[count] = d[nmsp].y + d[nmsp].height;
					
					count++;
					
				} 
				
				/*
				else {
				
					d[nmsp].x = p.scales.dateToPx(d.from.valueOf());
					d[nmsp].width = (p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()));
								
					d[nmsp].height = 1;
					d[nmsp].margin = 1;
					
					if(count === 0) {
						d[nmsp].y = p.view.padding;
					} else {
						d[nmsp].y = p.view.ys[count - 1] + d[nmsp].margin;
					}
					
				}
				*/
			});
		}
		
		function updateEventsAppearance(events) {
			
			events.select("rect.eventRect")
				.attr("width", attr.event.rect.width)
				.attr("height", attr.event.rect.height)
				.style("fill", attr.event.rect.fill);
				
			events.select("text.title")
				.attr("x", attr.event.text.x)
				.attr("y", attr.event.text.y)
				.attr("text-anchor", attr.event.text.anchor)
				.attr("display", attr.event.text.display)
				.style("font-size", attr.event.text.fontSize);
				
		}
		
		if( !initialised) return false;
		
		updateDataValues();
		
		var events = p.elements.events.selectAll("g.timeline_event")
			.data(p.data.filter(filterEvents), function(d) { return d.id; });
			
		// Update events
		events.attr("transform", attr.event.transform);
		
		// Update event appearace
		updateEventsAppearance(events);
		
		// Add new events
		var eventsEnter = events.enter()
			.append("g")
				.attr("id", function(d) {
					return "tl" + id + "_event_" + d.id;
				})
			.attr("class", "timeline_event")
			.attr("transform", attr.event.transform)
			.on("click", function(d) { console.log(d); });
	
		// Add event appearance
		createEventsAppearance(eventsEnter);
			
		// Remove events
		events.exit().remove();
		
		
	}
	
	function updateMinMax() {
		
		// Updates the scales used for semantic zooming
		p.scales.minMax.works.domain([ d3.min( p.data, function(d) {return d.weight ? d.weight : 0;} ), Math.min(300, d3.max( p.data, function(d) {return d.weight ? d.weight : 0;} )) ]);
		
	}

	// Initialiser
	me.apply = function () {
		
		function initTimeline() {
			
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
					.attr("class", "timeline_axis")
					.attr("id","tl" + id + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
					
			}
			
			function initEvents() {
			
				p.elements.events = p.svg.insert("g")
					.attr("class", "timeline_events")
					.attr("id", "tl" + id + "_events");
					
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
									
				p.svg.select(".timeline_events").insert("rect",":first-child")
					.attr("width", p.view.width)
					.attr("height", p.view.height)
					.attr("class","overlay");
					
				p.svg.select(".timeline_events").call( zoom.on("zoom", doZoom) );
				
			}
			
							
			initScales();
			initEvents();
			initAxis();
			initZoom();	
			
		}
		
		// Update parameters
		
		p.svg = arguments[0];

		p.view.width = p.svg.attr("width");
		p.view.height = p.svg.attr("height");
		
		if(p.data) {
			
			// Initialise visible range with 20% buffer
			
			var minFrom = d3.min( p.data, function(d) { return d.from; } ),
				maxTo = d3.max( p.data, function(d) { return d.to; } );
				
			p.view.from = new Date( minFrom.valueOf() - 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );//d3.min( p.data, function(d) { return d.from; } );
			p.view.to = new Date( maxTo.valueOf() + 0.2 * (maxTo.valueOf() - minFrom.valueOf()) );//d3.max( p.data, function(d) { return d.to; } );
			
		}
		
		initTimeline();
		
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
		
		updateMinMax();
		update();
		
		return me;
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