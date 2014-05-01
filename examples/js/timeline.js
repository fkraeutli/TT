TATEART = 0;

loadDataset = TATEART;
loadFormat = "csv";

$j = jQuery.noConflict();

var dataset = [],
	heap,
	timeline,
	fields,
	ui,
	urlsJSON = ["../../Tate/allartworks.js"];
	urlsCSV = ["../../Tate/artwork_data.csv"];


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
	
		if( loadFormat == "json") {
			
			d3.json(urlsJSON[loadDataset], function(error, data) {
			
				if( !error ) {
									
					data.forEach( function(d) {
						
						if(d.dateRange && d.dateRange.startYear) {
							
							d.from = new Date( +d.dateRange.startYear, 0, 1 );
							
							d.to = new Date( d.from.valueOf() );
							d.to.setFullYear( d.from.getFullYear() + 1 );

							// Replace thumbnail url for local one REMOVE THIS
							if ( d.thumbnailUrl ) {
								
								d.thumbnailUrl = "http://otis.local:8888/Tate/local/" + /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl)[0];
								
							}
						
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
		} else {			
			d3.csv(urlsCSV[loadDataset], function(error, data) {
			
				if( !error ) {
									
					data.forEach( function(d) {
						
						if(d.year) {
							
							d.from = new Date( +d.year, 0, 1 );
							
							d.to = new Date( d.from.valueOf() );
							d.to.setFullYear( d.from.getFullYear() + 1 );
						
							// Replace thumbnail url for local one REMOVE THIS
							if ( d.thumbnailUrl ) {
								
								d.thumbnailUrl = "http://otis.local:8888/Tate/local/" + /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl )[0];
								
							}
						
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
}


function makeHeap() {

	//dataset.splice(5000);

	heap = TT.layout.heap().data( dataset );
	
	timeline.add( heap );
	
	if (loadFormat == "json") {
		fields = [
			
			{
				title: "Classification",
				accessor: function(d) {
					return d.classification;
				}
				
			},
			
			{
				title: "Artist",
				accessor: function(d) {
				
					if(d.contributors.length) {
					
						return d.contributors[0].fc;
					
					}
					
					return "unknown";
					
				}
			},
			
			{
				title: "Medium",
				accessor: function(d) {
				
					return d.medium;
					
				}
			},
			
			{
				title: "Movements",
				accessor: function(d) {
					
					return d.movements;	
					
				}
			}
			/*
	,
			
			{
				title: "Subjects",
				accessor: function(d) {
				
					if(!d.subjects) return [];		
				
					var allSubjects = Array();
					
					var getSubjects = function( obj ) {
					
						allSubjects.push( obj );
						
						if( obj.children && obj.children.length) {
							
							obj.children.forEach( function(child) {
								
								getSubjects(child);
	
							} );
							
						}
					
					}
					
					getSubjects(d.subjects);
					
					return allSubjects;
				}
	
			}
	*/		
			
		];
	} else {
		
		fields = [
			{
			
				title: "Artist",
				accessor: function(d) {
					return d.artist;
				}
				
			},
			{
			
				title: "Medium",
				accessor: function(d) {
					return d.medium;
				}
				
			}
		];
		
	}
	
	var record = {
		
		title: function(d) {
			return d.title;
		},
		
		subtitle: function(d) {
			return d.artist + "<br>" + d.dateText;
		},
		
		image: function(d) {
			return d.thumbnailUrl;
		}
		
	}
	
	ui = TT.ui.panel().heap( heap ).fields( fields ).record( record ).initialise();
	
	
	
		
}









