BRITTEN 	= 0;
TATE 		= 1;
TATEART		= 2;
JOHNSTON 	= 3;

loadDataset = TATEART;

$j = jQuery.noConflict();

var dataset = [],
	heap,
	timeline,
	fields,
	urls = ["data/works.js", "../../Tate/allartists.js", "../../Tate/allartworks.js", "../../ltm/data/Johnston-Data.json"];


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
		
		d3.json(urls[loadDataset], function(error, data) {
		
			if( !error ) {
								
				data.forEach( function(d) {
					
					if(d.dateRange && d.dateRange.startYear) {
						
						d.from = new Date( +d.dateRange.startYear, 0, 1 );
						
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
		
		/*				
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
		*/
				
	}	
}


function makeHeap() {

	heap = TT.layout.heap().data( dataset );
	
	timeline.add( heap );
	
	ui = TT.ui.panel().heap(heap).fields(fields).initialise();
	
	fields = [
		
		{
			title: "Classification",
			accessor: function(d) {
				return d.classification;
			}
			
		},
		
		{
			title: "Contributors",
			accessor: function(d) {
			
				return d.contributors;
				
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
	
	
		
}









