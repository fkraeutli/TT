TT.timeline = function() {
	
	if(!TT.timeline.id) TT.timeline.id = 0;
	
	var	initialised = false,
		id = TT.timeline.id++,
		me = {},
		timeline = this,
		nmsp = "tl_" + id,
		x,
		y,
		zoom;
	
	var p = {
		
		axis: {},
		
		children: [],
		
		elements: {},

		format: {
			
			year: d3.time.format("%Y"),
			date: d3.time.format("%d %b %Y")
			
		},
		
		scales: {
			
			minMax: {
				
				// Update zoom extent here
				
				zoom: d3.scale.linear()
					.domain( [0.5, 240] ) 
					.range( [0, 1] )
				
			}
			
		},
		
		svg: false,

		view: {
			
			from: new Date( 1900 , 0, 1 ),
			to: new Date( 2000 , 0, 1 ),
			
			width: 800,
			height: 600,
			
			padding: 40
			
		}
	};
	
	// REMOVE
	test_timeline_p  = p;
	
	var attr = {
		
		axis: {
		
			tickFormat: function (d) {

				if( Math.round( (p.axis.scale().domain()[1].getFullYear() - p.axis.scale().domain()[0].getFullYear()) / p.axis.ticks()) >= 1 ) { // If there is not more than one tick per year represented

					return p.format.year(d);
					
				} else {
				
					return p.format.date(d);
					
				}

			}
			
		}

	};
			
	// Private functions
	
	function doZoom() {
		
		p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] );
	
		p.elements.axis.call(p.axis);
		
		update();
		
	}
	
	function update() {
		
		p.children.forEach( function(child) {
			
			child.update();
			
		} );
		
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
					
				p.elements.axis = p.svg.insert("g", ":first-child")
					.attr("class", "timeline_axis axis")
					.attr("id", nmsp + "_axis")
					.call(p.axis)
					.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
					
			}
				
			function initScales() {
			
				x = d3.scale.linear()
					.domain([0, p.view.width])
					.range([0, p.view.width]);
				
				y = d3.scale.linear()
					.domain([0, 1])
					.range([0, 1]);		
			
				// REMOVE
				test_timeline_x = x;
				test_timeline_y = y;
			
				p.scales.dateToPx = d3.scale.linear()
					.domain( [ p.view.from.valueOf(), p.view.to.valueOf() ] )
					.range( [ p.view.padding, p.view.width - p.view.padding ] );
					
				p.scales.pxToDate = d3.scale.linear()
					.domain( p.scales.dateToPx.range() )
					.range( p.scales.dateToPx.domain() );
					
			}	
			
			function initZoom() {						
				
				zoom = d3.behavior.zoom()
					.x(x)
					.y(y)
					.scaleExtent( p.scales.minMax.zoom.domain() );			
				
				p.elements.children = p.svg.insert("g")
					.attr("class", "timeline_children")
					.attr("id", nmsp + "_children")
					.call( zoom.on("zoom", doZoom) )
						.on( "dblclick.zoom", null)
						.on( "dblclick", function(d) {
							if( me.hasOwnProperty("publish") ) {	
		
								me.publish( {data: d, event: d3.event} );
					
							}
						})
						.on( "click", function(d) {
							if( me.hasOwnProperty("publish") ) {	
		
								me.publish( {data: d, event: d3.event} );
					
							}
						});
														
				p.elements.children.insert("rect",":first-child")
					.attr("width", p.view.width)
					.attr("height", p.view.height)
					.attr("class","overlay");
				
			}
							
			initScales();
			initAxis();
			initZoom();	
			
		}
		
		// Update parameters
		
		p.svg = arguments[0];

		p.view.width = +p.svg.attr("width") || p.view.width;
		p.view.height = +p.svg.attr("height") || p.view.width;
		
		initTimeline();
		
		initialised = true;
		
	};
	
	me.refresh = function() {
	
		function updateAxis() {
		
			p.scales.axis.domain( [ p.scales.pxToDate( x.domain()[0] ), p.scales.pxToDate( x.domain()[1] ) ] )
					.range( [0, p.view.width] );
					
			p.axis.tickSize(p.view.height - p.view.padding);

			p.elements.axis.call( p.axis )
				.attr("transform", "translate(0," + ( p.view.height - p.view.padding / 2 ) + ")");
			
		}		
	
		function updateScales() {
		
			// update domain (new width times scale)
			var diff = p.view.width - x.range()[1];
			x.range([ 0, p.view.width ])
				.domain( [ x.domain()[0], x.domain()[1] + diff ] );
			
			//y.range([0, p.view.height ]);		

			p.scales.dateToPx.domain( [ p.view.from.valueOf(), p.view.to.valueOf() ] )
				.range( [ p.view.padding, p.view.width - p.view.padding ] );
				
			p.scales.pxToDate.domain( p.scales.dateToPx.range() )
				.range( p.scales.dateToPx.domain() );
		}
		
		function updateSVG() {
					
			p.svg.attr("width", p.view.width);
			p.svg.attr("height", p.view.height);
		
		}
		
		function updateZoom() {
															
			p.svg.select(".overlay")
				.attr("width", p.view.width)
				.attr("height", p.view.height);
				
		}

		updateSVG();		
		updateScales();
		updateAxis();
		updateZoom();
		
		p.children.forEach( function(child) {
			
			child.refresh();
		
		} );
		
	};
	
	// Children
	me.add = function( layout ) {
		
		var g = p.elements.children.append("g")
			.attr( "id", layout.identifier() );
		
		layout.svg( g )
			.view( p.view )
			.scales( p.scales )
			.x( x )
			.y( y )
			.zoom( zoom )
			.parent( me );
			
		if( layout.data().length ) {
			
			var minFrom = d3.min( layout.data(), function(d) { return d.from; } );
			var maxTo = d3.max( layout.data(), function(d) { return d.to; } );
			
			if( minFrom < p.view.from ) {
				
				me.from( minFrom);
				
			}
			
			if (maxTo > p.view.to ) {
			
				me.to( maxTo );
				
			}
			
		}
			
		layout.initialise();
			
		p.children.push( layout );
		
		update();
		
	};
	
	me.children = function() {
		
		return p.children;
		
	};
	
	// Accessors

	me.domain = function(_) {
		
		if( !arguments.length ) return Array( p.view.from, p.view.to );
		
		if ( _.length === 2 &&  _[0] instanceof Date && _[1] instanceof Date && _[1] > _[0]) {
			
			p.view.from = _[0];
			p.view.to = _[1];
			
		}
		
		return me;
		
	};
	
	me.from = function(_) {
		
		if( !arguments.length ) return p.view.from;
		
		p.view.from = _;		
		
		me.refresh();
		
		return me;
		
	};
	
	me.height = function(_) {
		
		if( !arguments.length ) return p.view.height;
		
		p.view.height = _;		
		
		me.refresh();
		
		return me;
		
	};

	me.view = function() {
		
		return p.view;
		
	};
	
	me.width = function(_) {
		
		if( !arguments.length ) return p.view.width;
		
		p.view.width = _;
		
		me.refresh();
		
		return me;
		
	};
	
	me.to = function(_) {
		
		if( !arguments.length ) return p.view.to;
		
		p.view.to = _;		
		
		me.refresh();
		
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
	
	return me;
};