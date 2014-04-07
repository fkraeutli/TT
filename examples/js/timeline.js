var timeline,
	$j = jQuery.noConflict();

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

	
}
