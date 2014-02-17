/*

Generates Timeline view on array of data

data format: {

	id: "",
	from: Date(),
	to: Date(),
	title: ""

}


*/


var Timeline = function() {
	
	if(!Timeline.id) Timeline.id = 0;
	
	var	initialised = false,
		id = Timeline.id++,
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
					.domain( [0.9, 1000] ) 
					.range( [0, 1] )
				
			}
			
		},
		
		styles: {
			
			events: {
				height: 14,
				fontSize: 12,
				margin: 1,
				padding: 2,
				ys: [0]
			}
		},
		
		thresholds: {
			
			collapseLevel: 0.8,
			displayLevel: 0.6	
			
		},
		
		view: {
			
			from: new Date( 1800 , 0, 1 ),
			to: new Date( 2020 , 0, 1 ),
			
			width: 800,
			height: 600,
			padding: 40
			
		},
		
		zoomFactor: 1
		
		
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
					return (d.width * p.zoomFactor > d.title.length * p.fontSize) ? (x(d.x) < 0 && x(d.x) + d.width * p.zoomFactor > 0 ? p.styles.events.padding + -1*x(d.x) : p.styles.events.padding) : -p.styles.events.padding;
				},
				
				y: p.styles.events.height * 0.75
			},
			
			transform: function (d)  {
				return "translate(" + x(d.x) + "," + (d.y + y(0)) + ")";
			}
		},

	};
			
	// Init scales
	var x = d3.scale.linear()
		.domain([0, p.view.width])
		.range([0, p.view.width ]);
	
	var y = d3.scale.linear()
		.domain([0, p.view.height])
		.range([0, p.view.height]);
		
	// Private functions
	
	function doZoom() {
		
		p.zoomFactor = d3.event.scale;
		
		var events = p.elements.events.selectAll("g.timeline_event");
		var ax = p.svg.select(".timeline_axis");
		
		p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] );
		
		update();
		
		ax.call(p.axis);
		
	}
	
	function update() {
		
		function filterEvents(d) { 
		
			return d.renderLevel > -1 &&//p.thresholds.displayLevel  &&
				x(d.x) + d.width * p.zoomFactor >= 0 &&
				x(d.x) <= p.view.width &&
				d.y + y(0) > -p.styles.events.height && 
				d.y + y(0) < p.view.height;
				
		}
		
		function setEventsAppearance(events) {
			
			events.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height", attr.event.rect.height)
				.attr("width", attr.event.rect.width)
				.attr("class", "eventRect");
					
			// Add event text
			events.append("text")
				.attr("class", "title")
				.text( function(d) { return d.title; } )
				.attr("x", attr.event.text.x)
				.attr("y", attr.event.text.y)
				.attr("text-anchor", attr.event.text.anchor)
				.attr("display", attr.event.text.display);
				
		}
		
		function updateDataValues() {
				
			function computeRenderLevel(data, attribute) {
				
				if(data.totalWorks) {
					return Math.pow( p.scales.minMax.works(data.totalWorks), 0.02 / p.scales.minMax.zoom(p.zoomFactor) ) + p.scales.minMax.zoom(p.zoomFactor); 
				} else {
					return 0;
				}

		
			}

			p.data.forEach(function(d) {
			
				d.renderLevel = computeRenderLevel(d);
				
			});
			
			var count = 0;
			
			p.data.forEach(function(d) {	
			
				if( d.renderLevel > p.thresholds.displayLevel ) {
				
					d.x = p.scales.dateToPx(d.from.valueOf());
					d.width = ( p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()) );
					
					d.height = d.renderLevel < p.thresholds.collapseLevel ? 1 : p.styles.events.height;
					d.margin = d.renderLevel < p.thresholds.collapseLevel ? 1 : p.styles.events.margin;
					
					if(count === 0) {
					
						d.y = p.view.padding;
						
					} else {
					
						d.y = p.styles.events.ys[count - 1] + d.margin;
						
					}
					
					p.styles.events.ys[count] = d.y + d.height;
					
					count++;
					
				} else {
				
					d.x = p.scales.dateToPx(d.from.valueOf());
					d.width = (p.scales.dateToPx(d.to.valueOf()) - p.scales.dateToPx(d.from.valueOf()));
								
					d.height = 1;
					d.margin = 1;
					
					if(count === 0) {
						d.y = p.view.padding;
					} else {
						d.y = p.styles.events.ys[count - 1] + d.margin;
					}
					
				}
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
				.attr("display", attr.event.text.display);
				
		}
		
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
		setEventsAppearance(eventsEnter);
			
		// Remove events
		events.exit().remove();
		
		
	}
	
	function updateMinMax() {
			
		p.scales.minMax.works.domain([ d3.min( p.data, function(d) {return d.totalWorks ? d.totalWorks : 0;} ), Math.min(300, d3.max( p.data, function(d) {return d.totalWorks ? d.totalWorks : 0;} )) ]);
		
	}

	// Initialiser
	me.apply = function () {
		
		function initTimeline() {
			
			function initAxis() {
				p.scales.axis = d3.time.scale()
					.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] )
					.range([0, p.view.width]);		
				
				p.axis = d3.svg.axis()
					.scale(p.scales.axis)
					.tickSize(p.view.height - p.view.padding)
					.tickFormat(attr.axis.tickFormat)
					.orient("top");
					
				p.elements.axis = p.svg.append("g")
					.attr("class", "timeline_axis")
					.attr("id","tl" + id + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + (p.view.height - p.view.padding/2) + ")");
			}
			
			function initEvents() {
				p.elements.events = p.svg.insert("g")
					.attr("class", "timeline_events")
					.attr("id", "tl" + id + "_events");
			}
				
			function initScales() {
			
				p.scales.dateToPx = d3.scale.linear()
					.domain([p.view.from.valueOf(), p.view.to.valueOf()])
					.range([p.view.padding, p.view.width - p.view.padding]);
					
				p.scales.pxToDate = d3.scale.linear()
					.domain([p.view.padding, p.view.width - p.view.padding])
					.range([p.view.from.valueOf(), p.view.to.valueOf()]);
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
					
				p.svg.select(".timeline_events").call(zoom.on("zoom", doZoom));
				
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
			
			p.view.from = d3.min( p.data, function(d) { return d.from; } );
			p.view.to = d3.max( p.data, function(d) { return d.to; } );
			
		}
		
		initTimeline();
		updateMinMax();
		update();
		
		initialised = true;
	};
	
	// Accessors
	me.data = function(_) {
		if( !arguments.length ) return p.data;
		p.data = _;
		
		if(initialised) {
			updateMinMax();
			update();
		};	
		
		return me;
	};
	
	return me;
	
};