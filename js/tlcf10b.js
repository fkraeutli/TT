var currentYear = 2014,
	load = "artworks"
	url = "../ssl/britten/index.php/works/json_listWorks/yearFrom/1915/yearTo/2013/limit/2000";
	stats = {};
			

			
d3.json(url, function(error, data) {
	
	dataset = [];
	
	data = data.works;
	
	console.log(data);
	
	if(!error) {
		
		data.forEach(function(d) {
					
			if(d.date_completed_year) {
				
				d.to  		= new Date(+d.date_completed_year, +d.date_completed_month, +d.date_completed_day);
				
				if(d.date_commenced_year) {
					
					d.from	= new Date(+d.date_commenced_year, +d.date_commenced_month, +d.date_commenced_day);
					
				} else {
				
					d.from  	= new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
					
				}
				
				d.date 		= d.from;
				d.id		= d.catalogue_no;
				d.totalWorks = 0;
				
				dataset.push(d);
			}
			
		});
		
		var worksPerGenre = [];

		dataset.forEach( function(d) {
			
			var id = d.genre;
			
			if(worksPerGenre[id]) {
			
				d.totalWorks = Math.min(500, worksPerGenre[id]);
				
			} else {
				
				worksPerGenre[id] = dataset.filter( function(e) {return e.genre == id;} ).length
				
			}
			
		} )
		
	
		// Populate stats
		stats.minDate = d3.min(dataset, function(d) {
			if(d.date) return d.date;
		});
		
		stats.maxDate = d3.max(dataset, function(d) {
			if(d.date) return d.date;
		});
	
	
		makeCrossfilter();
	
	} else {
	
		console.log(error);
		
	}
	
});

function makeCrossfilter() {
	
	var cf = crossfilter(dataset),
		all = cf.groupAll(),
		
		bornDate = cf.dimension( function(d) {return d.from;} ),
		bornDates = bornDate.group( d3.time.year ),
		
		diedDate = cf.dimension(function(d) {return d.to;}),
		diedDates = diedDate.group(d3.time.year),
		
		numWork = cf.dimension(function(d) { return d.totalWorks; }),
		numWorks = numWork.group(function(d) { return Math.floor(d / 10) * 10; })
			
	var charts = [

		barChart()
			.dimension(bornDate)
			.group(bornDates)
			.round(d3.time.year.round)
		.x( d3.time.scale()
			.domain( [stats.minDate, stats.maxDate] ) 
			.rangeRound([0, 400] ) ),
			
		barChart()
			.dimension(diedDate)
			.group(diedDates)
			.round(d3.time.year.round)
		.x( d3.time.scale()
			.domain( [stats.minDate, stats.maxDate] ) 
			.rangeRound([0, 400] ) ),
		
		barChart()
			.dimension(numWork)
			.group(numWorks)
		.x(d3.scale.pow(2)
			.domain([0, 500])
			.rangeRound([0, 400]))
	
	];
	
	// Bind the chats to the DOM elements and listen to charts brush event to update other charts/displays
	var chart = d3.selectAll(".chart")
		.data(charts)
		.each( function(chart) {
			chart.on("brush", renderAll)
				.on("brushend", renderAll);
		} );
		
		
	var timeline1 = new Timeline(bornDate.top(99999));

	
	// Render the specified display
	function render(method) {
		d3.select(this).call(method);
	}
	
	// Function to re-render everything when a chart changes
	function renderAll() {
		chart.each(render);
		timeline1.updateData(bornDate.top(99999));
	}
	
	renderAll();
	
	// filter function
	window.filter = function(filters) {
		filters.forEach(function(d, i) { charts[i].filter(d); });
		renderAll();
	};
	
	// reset function
	window.reset = function(i) {
		charts[i].filter(null);
		renderAll();
	};
	
	function barChart() {
		
		if(!barChart.id) barChart.id = 0;
		
		var x,
			y = d3.scale.linear().range([80, 0]),
			id = barChart.id++,
			axis = d3.svg.axis().orient("bottom"),
			axisHeight = 20,
			brush = d3.svg.brush(),
			brushDirty,
			dimension,
			group,
			round;
			
		function chart(div) {
			
			var width = x.range()[1];
			var height = y.range()[0];
			
			y.domain( [0, group.top(1)[0].value] );
			
			div.each( function() {
				
				var div = d3.select(this),
					g = div.select("g");
					
				// Create the skeletal chart
				if( g.empty() ) {
					
					// Add reset link
					div.select(".title").append("a")
						.attr("onclick", "reset(" + id + ")")
						.attr("class", "reset")
						.text("reset")
						.style("display", "none");
						
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
						
					// In the original example, there is some code to draw nice handles (resizePath function)
					
				}
				
				
				// Redraw brush if necessary
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
				
			} );
		
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
			
		}
		
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
		
		
		// accessors
		chart.x = function(_) {
			if(!arguments.length) return x;
			x = _;
			axis.scale(x);
			brush.x(x);
			return chart;
		};
		
		chart.y = function(_) {
			if (!arguments.length) return y;
			y = _;
			return chart;
		};
		
		chart.dimension = function(_) {
			if (!arguments.length) return dimension;
			dimension = _;
			return chart;
		};
		
		chart.filter = function(_) {
			if (_) {
				brush.extent(_);
				dimension.filterRange(_);
			} else {
				brush.clear();
				dimension.filterAll();
			}
			brushDirty = true;
			return chart;
		};
		
		chart.group = function(_) {
			if (!arguments.length) return group;
			group = _;
			return chart;
		};
		
		chart.round = function(_) {
			if (!arguments.length) return round;
			round = _;
			return chart;
		};
	
		return d3.rebind(chart, brush, "on");
		
	}
	
}


// The timeline
var Timeline = function(events) {
	
	var timeline = this;
	
	var p = {
		axis: {},
		elements: {
			height: 14,
			ys: [0],
			margin: 1,
			padding: 2
		},
		events: events,
		fontSize: 12,
		format: {
			year: d3.time.format("%Y"),
			date: d3.time.format("%d %b %Y")
		},
		minMax: {
			width: d3.scale.linear()
				.domain([0, 1])
				.range([0, 1]),
			works: d3.scale.linear()
				.domain([0, 1])
				.range([0, 1]),
			zoom: d3.scale.linear()
				.domain([.9, 1000]) // update zoom extent here
				.range([0, 1])
		},
		timeline: {
			from: new Date(1800,0,1),
			to: new Date(2020,0,1)
		},
		thresholds: {
			collapseLevel: 0.8,
			displayLevel: 0.6	
		},
		scale: {},
		stats: {},
		timelineInitialised: false,
		viewport: {
			width: 800,
			height: 600,
			padding: 40
		},
		weightAttribute: "works",
		zoomFactor: 1
	};
		
	var properties = {	
	
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
			transform: function (d)  {
				return "translate(" + x(d.x) + "," + (d.y + y(0)) + ")";
			}
		},
		
		rect: {
			height: function(d) {
					return Math.min(d.height * p.zoomFactor, d.height) + "px";	
			},
			width: function(d) {
				return (d.width * p.zoomFactor) + "px";
			}
		},
		
		text: {
			anchor: function(d) {		
				return p.zoomFactor >= p.thresholds.collapseLevel && d.width * p.zoomFactor > d.title.length * p.fontSize ? "start" : "end";	
			},
			display: function(d) {
				return d.renderLevel > p.thresholds.collapseLevel ? "block" : "none";	
			},
			x: function (d) {
				return (d.width * p.zoomFactor > d.title.length * p.fontSize) ? (x(d.x) < 0 && x(d.x) + d.width * p.zoomFactor > 0 ? p.elements.padding + -1*x(d.x) : p.elements.padding) : -p.elements.padding;
			},
			y: p.elements.height * 0.75
		}
	};
		
	// Init scales
	var x = d3.scale.linear()
		.domain([0, p.viewport.width])
		.range([0, p.viewport.width ]);
	
	var y = d3.scale.linear()
		.domain([0, p.viewport.height])
		.range([0, p.viewport.height]);

	var zoom;
	
	makeTimeline();
	update();
	
	this.updateData = function(data) {
		p.events = data;
		
		updateMinMax();
		update();
	}
	
	function update() {
	
		function filterEvents(d) { 
			return d.renderLevel > -1//p.thresholds.displayLevel 
				&& x(d.x) + d.width * p.zoomFactor >= 0 
				&& x(d.x) <= p.viewport.width 
				&& d.y + y(0) > -p.elements.height 
				&& d.y + y(0) < p.viewport.height;
		} 
		
		function setEventsAppearance(events) {
			
			events.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height", properties.rect.height)
				.attr("width", properties.rect.width)
				.attr("class", "eventRect");
					
			// Add event text
			events.append("text")
				.attr("class", "title")
				.text(function(d) { return d.title; })
				.attr("x", properties.text.x)
				.attr("y", properties.text.y)
				.attr("text-anchor", properties.text.anchor)
				.attr("display", properties.text.display);
				
		}
	
		function updateEventValues() {
				
			function computeRenderLevel(data, attribute) {
				
				if(attribute === "width") {
					return p.minMax.width(data.width) + p.minMax.zoom(p.zoomFactor); 
				} else if(attribute === "works") {
				
					if(data.totalWorks) {
						return Math.pow( p.minMax.works(data.totalWorks), 0.02 / p.minMax.zoom(p.zoomFactor) ) + p.minMax.zoom(p.zoomFactor); 
					} else {
						return 0;
					}
				}
			
				return 0;
			}

			p.events.forEach(function(d) {
				d.renderLevel = computeRenderLevel(d, p.weightAttribute);
			})
			
			var count = 0;
			
			p.events.forEach(function(d) {	
			
				if(d.renderLevel > p.thresholds.displayLevel) {
					d.x = p.scale.dateToPx(d.from.valueOf());
					d.width = (p.scale.dateToPx(d.to.valueOf()) - p.scale.dateToPx(d.from.valueOf()));
					
								
					d.height = d.renderLevel < p.thresholds.collapseLevel ? 1 : p.elements.height;
					d.margin = d.renderLevel < p.thresholds.collapseLevel ? 1 : p.elements.margin;
					
					if(count === 0) {
						d.y = p.viewport.padding;
					} else {
						d.y = p.elements.ys[count - 1] + d.margin;
					}
					
					p.elements.ys[count] = d.y + d.height;
					
					count++;
				} else {
					d.x = p.scale.dateToPx(d.from.valueOf());
					d.width = (p.scale.dateToPx(d.to.valueOf()) - p.scale.dateToPx(d.from.valueOf()));
								
					d.height = 1;
					d.margin = 1;
					
					if(count === 0) {
						d.y = p.viewport.padding;
					} else {
						d.y = p.elements.ys[count - 1] + d.margin;
					}
					
				}
			});
		}
		
		function updateEventsAppearance(events) {
			
			events.select("rect.eventRect")
				.attr("width", properties.rect.width)
				.attr("height", properties.rect.height);
				
			events.select("text.title")
				.attr("x", properties.text.x)
				.attr("y", properties.text.y)
				.attr("text-anchor", properties.text.anchor)
				.attr("display", properties.text.display);
				
		}
					
		updateEventValues();
	
		var events = p.elements.events.selectAll("g.event")
			.data(p.events.filter(filterEvents), function(d) { return d.id; });
		
		// Update events
		events.attr("transform", properties.event.transform);
		
		// Update event appearace
		updateEventsAppearance(events);
	
		// Add new events
		var eventsEnter = events.enter()
			.append("g")
				.attr("id", function(d) {
					return "event_" + d.id;
				})
			.attr("class", "event")
			.attr("transform", properties.event.transform);
	
		// Add event appearance
		setEventsAppearance(eventsEnter);
			
		// Remove events
		events.exit().remove();
			
	}
	
	function updateMinMax() {
			
			p.minMax.width.domain([ d3.min( p.events, function(d) {return d.width;} ), d3.max( p.events, function(d) {return d.width;} ) ]);
			p.minMax.works.domain([ d3.min( p.events, function(d) {return d.totalWorks ? d.totalWorks : 0;} ), Math.min(300, d3.max( p.events, function(d) {return d.totalWorks ? d.totalWorks : 0;} )) ]);
			
		}
		
	function makeTimeline() {
		
		p.svg = d3.select("body").insert("svg", ":first-child")
			.attr("id", "timeline")
			.attr("width", p.viewport.width)
			.attr("height", p.viewport.height);

		function initAxis() {
			p.scale.axis = d3.time.scale()
				.domain( [ p.scale.pxToDate( x.domain()[0] ), p.scale.pxToDate( x.domain()[1] ) ] )
				.range([0, p.viewport.width]);		
			
			p.axis = d3.svg.axis()
				.scale(p.scale.axis)
				.tickSize(p.viewport.height - p.viewport.padding)
				.tickFormat(properties.axis.tickFormat)
				.orient("top");
				
			p.elements.axis = p.svg.append("g")
				.attr("id","axis")
				.call(p.axis)
				.attr("transform", "translate(0," + (p.viewport.height - p.viewport.padding/2) + ")");
		}
	
		function initEvents() {
			p.elements.events = p.svg.insert("g")
				.attr("id", "events");
		}
			
		function initScales() {
		
			p.scale.dateToPx = d3.scale.linear()
				.domain([p.timeline.from.valueOf(), p.timeline.to.valueOf()])
				.range([p.viewport.padding, p.viewport.width - p.viewport.padding]);
				
			p.scale.pxToDate = d3.scale.linear()
				.domain([p.viewport.padding, p.viewport.width - p.viewport.padding])
				.range([p.timeline.from.valueOf(), p.timeline.to.valueOf()]);
		}
			
		function initZoom() {						
			
			zoom = d3.behavior.zoom()
				.x(x)
				.y(y)
				.scaleExtent( p.minMax.zoom.domain() );
								
			d3.select("#events").insert("rect",":first-child")
				.attr("width", p.viewport.width)
				.attr("height", p.viewport.height)
				.attr("class","overlay");
				
			d3.select("#events").call(zoom.on("zoom", doZoom));
			
		}
						
		initScales();
		initEvents();
		initAxis();
		initZoom();
	}	

	function doZoom() {
		
		p.zoomFactor = d3.event.scale;
		
		var events = p.elements.events.selectAll("g.event");
		var ax = p.svg.select("#axis");
		
		p.scale.axis.domain( [ p.scale.pxToDate( x.domain()[0] ), p.scale.pxToDate( x.domain()[1] ) ] );
		
		update();
		
		ax.call(p.axis);
		
	}
	
	
}