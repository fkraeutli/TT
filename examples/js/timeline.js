loadFormat = "json";

$j = jQuery.noConflict();

var dataset = [],
	heap,
	timeline,
	fields,
	ui


$j(make);

function make() {

	timeline = TT.timeline()
		.domain( [ new Date(1950,0,1), new Date(2014,0,1) ] );
	
	d3.select("svg#timeline")
		.attr("class", "timeline")
		.attr("width", $j(window).width() )
		.attr("height", $j(window).height() )
		.call(timeline);
	
	$j(window).resize(function() {
		timeline.width( $j(window).width() )
			.height( $j(window).height() );
	})
	
	GeffryeAPI.initObjectDataset();
	
	var heapInitialised = false;
	
	$j(document).on("GeffryeAPI_loadingCompleted", function() {
		
			console.log( "Dataset Loaded" );
		
	} )
	.on("GeffryeAPI_loadingProgressed", function ( event, numFetched, numRows ) {
	
		console.log( Math.floor( numFetched / numRows * 100 ) + "% loaded" );
	
		dataset = GeffryeAPI.dataset();
		
		if ( ! heapInitialised ) {
			
			makeHeap();
			
			heapInitialised = true;
			
		} else {
			
			heap.data( dataset );
			
		}
	
	} );
				

	//makeHeap();
	
		
}



function makeHeap() {

	heap = TT.layout.heap().data( dataset );
	
	timeline.add( heap );	
	
	fields = [];
	
	record = {
			
		title: function( d ) {
			
			return "Title";
			
			
		},
		
		subtitle: function(d) {
			
			return "Subtitle";
			
		},
		
		image: function(d) {
			
			return d.thumbnailUrl;
			
		}
		
	}
	
	ui = TT.ui.panel().heap( heap ).fields( fields ).record( record ).initialise();

		
}
