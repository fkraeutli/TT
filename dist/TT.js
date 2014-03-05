var  TT = {
	name: "Timeline Tools",
	author: {
		name: "Florian Kräutli",
		email: "florian@kraeutli.com",
		twitter: "@fkraeutli",
		url: "http://www.kraeutli.com"
	},
	version: "0.0.1"
};
  
  ;TT.crossfilter = function() {
	
	if(!TT.crossfilter.id) TT.crossfilter.id = 0;
	
	var cf,
		charts = [],
		data,
		div ,
		filters = [],
		id = TT.crossfilter.id++,
		initialised = false,
		me = {};
		
	var p = {
		view: {
			width: 400,
			height: 200
		}
	};
	
	try {
		
		cf = crossfilter();
		
	} catch(e) {
		
		console.error("Crossfilter is not loaded. Get Crossfilter from http://square.github.io/crossfilter/");
		return false;
		
	}	
	
	// Private functions

	function drawChart(filter) {
		
		var chart = new BarChart()
			.dimension(filter.dimension)
			.group(filter.group)
			.title(filter.title);
		
		
		if(filter.isDate) {
		
			chart.x(
				d3.time.scale()
					.domain([filter.min, filter.max])
					.rangeRound( [0, p.view.width] )
			);
			
		} else {
			
			chart.x( d3.scale.linear()
				.domain( [filter.min, filter.max] )
				.rangeRound( [0, p.view.width] ) 
			);
			
		}
		
		charts.push(chart);

		div.call(chart);

		chart.on("brush", renderAll)
			.on("brushend", renderAll);
			
	}
	
	function renderAll() {
	
		for( var i = 0; i < charts.length; i++) {
			charts[i].drawChart();
		}
		
		publishUpdate();
	}
	
	function publishUpdate() {
		
		if(me.hasOwnProperty("publish") && charts[0]) {	
			
			me.publish( charts[0].dimension().top(999999) );
			
		}
		
	}

	// Initialiser
	
	me.apply = function() {
		
		div = arguments[0];
		
		for( var i = 0; i < filters.length; i++ ) {
		
			drawChart( filters[i] );
			
		}
		
		initialised = true;
		
	};
	
	// Methods
	
	me.addFilter = function(params) {
		
		var filter = {};
		
		filter.title = params.title || params.dimension.toString();
		
		if(typeof params.dimension === "string") {
		
			filterFunction = function(d) {
				return d[params.dimension];
			};
			
		} else if (typeof params.dimension === "function") {

			filterFunction = params.dimension;

		} else {
		
			return false;
			
		}
	
		filter.dimension = cf.dimension(filterFunction);
		
		filter.group = filter.dimension.group(params.group);

		filter.min = d3.min( data, filterFunction );
		filter.max = d3.max( data, filterFunction );
		
		filter.isDate = (filter.min instanceof Date);
		
		filters.push(filter);
		
		if(initialised) {
			drawChart(filter);
		}
		
		return me;
	};
	
	me.forcePublish = function() {
		
		publishUpdate();
		
	};
	
	
	// Accessors
	
	me.charts = function() {
		
		return charts;
		
	};
	
	me.data = function(_) {
		if( !arguments.length ) return data;
		
		data = _;
		
		cf.remove();
		cf.add(data);
		
		for(var i = 0; i < charts.length; i++) {
			
			charts[i].redrawChart();
			
		}
		
		publishUpdate();
		
		return me;
	};
	
	me.filters = function() {
		
		return filters;
		
	};
	
	return me;
	
	
	// -- BarChart


	function BarChart() {
		
		if(!BarChart.id) BarChart.id = 0;
		
		var div,
			me = {},
			x,
			y = d3.scale.linear().range([100, 0]),
			id = BarChart.id++,
			axis = d3.svg.axis().orient("bottom"),
			axisHeight = 20,
			brush = d3.svg.brush(),
			brushDirty,
			dimension,
			group,
			round,
			title,
			svg;
	
		// Brush
		function initBrush() {
		
		brush.on( "brushstart.chart", function() {
			
			var div = d3.select(this.parentNode.parentNode.parentNode);
			
			div.select(".title a")
				.style("display", null);
			
		} );
		
		brush.on( "brush.chart", function() {
			
			var g = d3.select(this.parentNode),
				extent = brush.extent();
				
			if(round) {
				g.select(".brush")
					.call(brush.extent(extent = extent.map(round)));
			}		
			
			g.select("#clip-" + id + " rect")
				.attr("x", x(extent[0]))
				.attr("width", x(extent[1]) - x(extent[0]));
				
			dimension.filterRange(extent);
			
		} );
		
		brush.on( "brushend.chart", function() {
				
				if(brush.empty()) {
					
					var div = d3.select(this.parentNode.parentNode.parentNode);
					
					div.select(".title a")
						.style("display", "none");
						
					div.select("#clip-" + id + " rect")
						.attr("x", null)
						.attr("width", "100%");
						
					dimension.filterAll();
					
				}
				
			} );
		}
	
		// Initialiser
		
		me.apply = function() {
			
			div = arguments[0];
			
			div = div.append("div")
				.attr("id", "barChart_" + id)
				.attr("class", "chart");
				
			initBrush();
			me.drawChart();
			
		};
	
		// Methods
		me.drawChart = function(redraw) {
		
			function barPath(groups) {
					
				var path = [],
					i = -1,
					n = groups.length,
					d;
					
				// Generate path part per value				
				while (++i < n) {
					
					d = groups[i];
					
					path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
					
				}
				
				return path.join("");
				
			}
			
			function drawChartSkeleton() {
				// Add title 
				div.append("div")
					.attr("class", "title")
					.text(title)		
					
				// Add reset link
				.append("a")
					.attr("class", "reset")
					.text("reset")
					.style("display", "none")
					.on("click", function() { me.reset(); } );
					
				// Append SVG element
				g = div.append("svg")
						.attr("width", width)
						.attr("height", height + axisHeight)
					.append("g");
					
				// Append clipping path for highlighting selection
				g.append("clipPath")
					.attr("id", "clip-" + id)
					.append("rect")
					.attr("width", width)
					.attr("height", height);
					
				// Append paths for data
				g.selectAll(".bar")
					.data( ["background", "foreground"] )
				.enter()
					.append("path")
					.attr("class", function(d) {
							return d + " bar";
						})
					.datum(group.all());
					
				// Apply clipping path to foreground path
				g.selectAll(".foreground.bar")
					.attr("clip-path", "url(#clip-" + id + ")");
					
				// Append axis
				g.append("g")
					.attr("class", "axis")
					.attr("transform", "translate(0, " + height + ")")
					.call(axis);
					
				// Initialise brush component
				var gBrush = g.append("g")
					.attr("class", "brush")
					.call(brush);
					
				gBrush.selectAll("rect")
					.attr("height", height);
			}
					
			var width = x.range()[1];
			var height = y.range()[0];
			
			y.domain( [0, group.top(1)[0].value] );
			
			var g = div.select("g");
			
			// Create the skeletal chart
			if( g.empty() || redraw) {
				
				drawChartSkeleton();
				
			}
			
			if(brushDirty) {
			
				brushDirty = false;
				g.selectAll(".brush")
					.call(brush);
				
				// Display reset button if brush is usde
				div.select(".title a")
					.style("display", brush.empty() ? "none" : null);
				
				// Adjust clipping area
				if( brush.empty() ) {
				
					g.selectAll("#clip-" + id + " rect")
						.attr("x", 0)
						.attr("width", width);
						
				} else {
					
					var extent = brush.extent();
					
					g.selectAll("#clip-" + id + " rect")
						.attr( "x", x(extent[0]) )
						.attr( "width", x(extent[1]) - x(extent[0]) );
							
				}
			}
			
			g.selectAll(".bar").attr("d", barPath);
		
			
		};
		
		me.reset = function() {
			
			charts[id].filter(null);
			renderAll();
			
		};
		
		me.redrawChart = function() {
			
			div.select("svg").remove();
			div.select(".title").remove();
			me.drawChart(true);
			
		};
		
		// Accessors
		
		me.dimension = function(_) {
			if (!arguments.length) return dimension;
			dimension = _;
			return me;
		};
		
		me.filter = function(_) {
			if (_) {
				brush.extent(_);
				dimension.filterRange(_);
			} else {
				brush.clear();
				dimension.filterAll();
			}
			brushDirty = true;
			return me;
		};
		
		me.group = function(_) {
			if (!arguments.length) return group;
			group = _;
			return me;
		};
			
		me.round = function(_) {
			if (!arguments.length) return round;
			round = _;
			return me;
		};
		
		me.title = function(_) {
			if (!arguments.length) return title;
			title = _;
			return me;
		};
		
		me.x = function(_) {
			if(!arguments.length) return x;
			x = _;
			axis.scale(x);
			brush.x(x);
			return me;
		};
		
		me.y = function(_) {
			if (!arguments.length) return y;
			y = _;
			return me;
		};
		
		return d3.rebind(me, brush, "on");
	}
};
;TT.observer = {

	addSubscriber: function(callback) {
		this.subscribers[this.subscribers.length] = callback;
	},

	removeSubscriber: function(callback) {
		for (var i = 0; i < this.subscribers.length; i++) {
			if (this.subscribers[i] === callback) {
				delete(this.subscribers[i]);
			} 
		}
	},
	
	publish: function(what) {
		for (var i = 0; i < this.subscribers.length; i++) {
			if (typeof this.subscribers[i] === 'function') {

				this.subscribers[i](what);
			}
		} 
	},
	
	make: function(o) { // turns an object into a publisher
		for(var i in this) {
			o[i] = this[i];
			o.subscribers = [];
		}
	}
};

;/*

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
		me = {},
		timeline = this,
		zoom;
		
	//var 
	p = {
		
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
				height: 14,
				fontSize: 12,
				margin: 1,
				padding: 2
			}
		},
		
		thresholds: {
			
			collapse: 0.99,
			display: 0.7	
			
		},
		
		view: {
			
			from: new Date( 1800 , 0, 1 ),
			to: new Date( 2020 , 0, 1 ),
			
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
		
			tickFormat: function(d) {
				if( Math.round( (p.axis.scale().domain()[1].getFullYear() - p.axis.scale().domain()[0].getFullYear()) / p.axis.ticks()) >= 1 ) { // If there is not more than one tick per year represented
					return p.format.year(d);
				} else {
					return p.format.date(d);
				}
			}
		},
		
		event: {
		
			rect: {
				height: function(d) {
						return Math.min(d.height * p.zoom.factor, d.height) + "px";	
				},
				width: function(d) {
				
					return (d.width * p.zoom.factor) + "px";
					
				}
			},
			
			text: {
			
				anchor: function(d) {		
					return p.zoom.factor >= p.thresholds.collapse && d.width * p.zoom.factor > d.title.length * p.styles.events.fontSize ? "start" : "end";	
				},
				
				display: function(d) {
					return d.renderLevel > p.thresholds.collapse ? "block" : "none";	
				},
				
				fontSize: p.styles.events.fontSize + "px",
				
				x: function (d) {
					return (d.width * p.zoom.factor > d.title.length * p.styles.events.fontSize) ? (x(d.x) < 0 && x(d.x) + d.width * p.zoom.factor > 0 ? p.styles.events.padding + -1*x(d.x) : p.styles.events.padding) : -p.styles.events.padding;
				},
				
				y: p.styles.events.height * 0.75
			},
			
			transform: function (d)  {
				return "translate(" + x(d.x) + "," + (d.y + y(0)) + ")";
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
			
			// 
			events.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height", attr.event.rect.height)
				.attr("width", attr.event.rect.width)
				.attr("class", "eventRect")
				.on("click", function(d) { console.log(d); });
					
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
		
			return d.renderLevel > p.thresholds.display  &&
				x(d.x) + d.width * p.zoom.factor >= 0 &&
				x(d.x) <= p.view.width &&
				d.y + y(0) > -p.styles.events.height && 
				d.y + y(0) < p.view.height;
				
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
			
				d.renderLevel = computeRenderLevel(d);
				
			});
			
			var count = 0;
			
			p.data.forEach(function(d) {	
			
				if( d.renderLevel > p.thresholds.display ) {
				
					d.x = p.scales.dateToPx(d.from.valueOf());
					d.width = ( p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()) );
					
					d.height = d.renderLevel < p.thresholds.collapse ? 1 : p.styles.events.height;
					d.margin = d.renderLevel < p.thresholds.collapse ? 1 : p.styles.events.margin;
					
					if(count === 0) {
					
						d.y = p.view.padding;
						
					} else {
					
						d.y = p.view.ys[count - 1] + d.margin;
						
					}
					
					p.view.ys[count] = d.y + d.height;
					
					count++;
					
				} 
				
				/*
				else {
				
					d.x = p.scales.dateToPx(d.from.valueOf());
					d.width = (p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()));
								
					d.height = 1;
					d.margin = 1;
					
					if(count === 0) {
						d.y = p.view.padding;
					} else {
						d.y = p.view.ys[count - 1] + d.margin;
					}
					
				}
				*/
			});
		}
		
		function updateEventsAppearance(events) {
			
			events.select("rect.eventRect")
				.attr("width", attr.event.rect.width)
				.attr("height", attr.event.rect.height);
				
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
			.attr("transform", attr.event.transform);
	
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
		
		updateMinMax();
		update();
		
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