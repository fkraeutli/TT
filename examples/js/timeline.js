BRITTEN 	= 0;
TATE 		= 1;
TATEART		= 2;
JOHNSTON 	= 3;

loadDataset = TATEART;

$j = jQuery.noConflict();

var dataset = [],
	heap,
	timeline,
	urls = ["data/works.js", "../../Tate/allartists.js", "../../Tate/artwork_data.csv", "../../ltm/data/Johnston-Data.json"];


$j(make);

function make() {

	timeline = TT.timeline()
		.domain( [ new Date(1800,0,1), new Date(2014,0,1) ] );
	
	d3.select("svg#timeline")
		.attr("class", "timeline")
		.attr("width", $j(window).width() )
		.attr("height", $j(window).height() )
		.call(timeline);
	
	$j(window).resize(function() {
		timeline.width( $j(window).width() )
			.height( $j(window).height() );
	})
	
	
	if (loadDataset === TATEART) {
						
		d3.csv(urls[loadDataset], function(error, data) {
		
			if( !error ) {
								
				data.forEach( function(d) {
					
					if(d.year) {
						
						d.from = new Date( +d.year, 0, 1 );
						
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );
					
						if ( !isNaN(d.from.valueOf()) ){
							dataset.push(d);
						}
					}
					
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
		});
				
	}	
}


function makeHeap() {

	heapNoTurner = TT.layout.heap().data( dataset.filter( function(d) { return d.artist != "Turner, Joseph Mallord William"; }) );
	heapTurner = TT.layout.heap().data( dataset.filter( function(d) { return d.artist == "Turner, Joseph Mallord William"; }) );
	
	timeline.add( heapNoTurner );
	timeline.add( heapTurner );
	
}