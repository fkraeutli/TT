TATEART = 0;
COOPER = 1;
TICTAC = 2;
OXFORD = 3;
GEFFRYE = 4;
TATEJSON = 5;

if (!location.hash) {

	loadDataset = GEFFRYE;

} else {
	
	switch ( location.hash ) {
		
		case "#tate":
			loadDataset = TATEART;
			break;
			
		case "#tatejs":
			loadDataset = TATEJSON;
			break;
			
		case "#cooper":
			loadDataset = COOPER;
			break;
			
		case "#tictac":
			loadDataset = TICTAC;
			break;
			
		case "#oxford":
			loadDataset = OXFORD;
			break;
			
		case "#geffrye":
			loadDataset = GEFFRYE;
			break;
		
		
	}
	
}

$j = jQuery.noConflict();

var dataset = [],
	heap,
	timeline,
	fields,
	ui


$j( make );

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
	
	
	if ( loadDataset == TATEART ) {
		
		d3.csv( "../../Tate/artwork_data.csv", function(error, data) {
		
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
		
	} else if (loadDataset === TATEJSON) {
	
		
		d3.json( "../../Tate/allartworks.js", function(error, data) {
		
			if( !error ) {
								
				data.forEach( function(d) {
					
					if(d.dateRange && d.dateRange.startYear) {
						
						d.from = new Date( +d.dateRange.startYear, 0, 1 );
						
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );

						// Replace thumbnail url for local one REMOVE THIS
						
						if ( d.thumbnailUrl ) {
							
							var r = /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl);
							
							if ( r &&  r.length ) {
							
								d.thumbnailUrl = "http://otis.local:8888/Tate/local/" + /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl)[0];
								
							}
							
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
		
				
	} else if ( loadDataset == GEFFRYE ) {
	
		GeffryeAPI.initObjectDataset();
		
		var heapInitialised = false;
		
		$j(document).on("loadingCompleted", function() {
			
				console.log( "Dataset Loaded" );
			
		} )
		.on("loadingProgressed", function ( event, numFetched, numRows ) {
		
			console.log( Math.floor( numFetched / numRows * 100 ) + "% loaded" );
		
			dataset = GeffryeAPI.dataset();
			
			if ( ! heapInitialised ) {
				
				makeHeap();
				
				heapInitialised = true;
				
			} else {
				
				heap.data( dataset );
				
			}
			
			if ( numFetched >= numRows ) {
				
				//$j( this ).off( "loadingProgressed" );
				
			}
		
		} );
		
	} else if ( loadDataset === COOPER ) {
		
						
		d3.csv( "../../coopeHewittCollection/meta/objects.csv", function(error, data) {		
			
			if( !error ) {				
								
				data.forEach( function(d) {
					
					if(d.year_start != "" && d.year_end != "") {
						
						d.from = new Date( +d.year_start, 0, 1 );
						d.to = new Date( +d.year_end, 0, 1 );
					
						if ( d.primary_image && d.primary_image != "" ) {
							d.thumbnailUrl = d.primary_image.replace(/(_n.jpg|_z.jpg)/, "_b.jpg");
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
		
	} else if ( loadDataset === TICTAC ) {		
		
		d3.csv( "../../ssl/tictac/tictac_tablets.csv", function(error, data) {
			
			if( !error ) {						
								
				data.forEach( function(d) {
					
					if(d.date_entered_timestamp) {
						
						d.id = d.tablet_id;
						
						d.from = new Date( d.date_entered_timestamp );
						
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );
						
						d.thumbnailUrl = "../../ssl/tictac/assets/" + d.image_front;
					
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
		
	} else if ( loadDataset == OXFORD ) {
				
		d3.csv( "../../oxford/data/pottery.csv", function(error, data) {
	
			if ( !error ) {
			
				data.forEach( function(d) {
				
					d.id = d["Record - Vase-Number"];
				
					d.from = new Date( d["Record - Date - From-Date"], 0, 1);
					d.to = new Date( d["Record - Date - To-Date"], 0, 1);
					
					//d.thumbnailUrl = "http://www.beazley.ox.ac.uk/Watermark/displayImage.asp?id=" + d["Record - id"];
					d.thumbnailUrl = "http://www.beazley.ox.ac.uk/Vases/SPIFF/" + d["Record - Image-Record - Filename"].split(";")[0] + "cc001001.jpe";;
					
					if ( !isNaN(d.from.valueOf()) ){
						dataset.push(d);
					}
				
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
			
			}	
		} )
	
		
	}
				

	//makeHeap();
	
		
}



function makeHeap() {

	heap = TT.layout.heap().data( dataset );
	
	timeline.add( heap );	
	
	if ( loadDataset == GEFFRYE ) {
	
		fields = [
				
				
			{
				
				title: "Collection",
				field: "collectionCategory",
				accessor: function(d) {
					
					return d.collectionCategory;
					
				},
							
			},
			
			{
				
				title: "Location",
				field: "location",
				accessor: function(d) {
					
					return d.location;
					
				}
				
			},
			
			{
				
				title: "Materials",
				field: "materials",
				accessor: function(d) {
					
					return d.materials;
					
				}
				
			}
				
		];
		
		for( var i = 0; i < fields.length; i++ ) {
			
			fields[ i ].initialise = function( callback ) {
					
					var obj = this;
					
					GeffryeAPI.loadField( obj.field, function() {
						
						delete obj.initialise;
						callback();
						
					} );
					
				}
						
		}
		
		record = {
					
			title: function(d) {
				
				return d.title[0] || d.wholeObjectName;
				
			},
			
			subtitle: function(d) {
				
				return d.labelText;
				
			},
			
			image: function(d) {
				
				return d.thumbnailUrl;
			}
			
		}
		
	} else if (loadDataset == TATEJSON) {
		
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
						
						var list = Array();
						
						for( var i = 0; i < d.contributors.length; i++ ) {
							
							list.push( d.contributors[ i ].fc );
							
						}
						return list;
					
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
					
					if ( ! d.movements ) {
						
						return Array( "unspecified" );
						
					}
					
					var movementNames = Array();
					
					for ( var i = 0; i < d.movements.length; i++ ) {
						
						movementNames.push( d.movements[ i ].name );
						
					}
					
					
					return movementNames;	
					
				}
			}
			
	/*
,
			
			{
				title: "Subjects",
				accessor: function(d) {
				
					if( ! d.subjects) return [];		
				
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
					
					var subjectNames = Array();
					
					for( var i = 0; i < allSubjects.length; i++ ) {
						
						subjectNames.push( allSubjects[ i ].name );
						
					}
					console.log( "doing" );
					
					return subjectNames;
				}
	
			}
*/
			
			
		];
		
		
		record = {
			
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
	
	} else if ( loadDataset == TATEART ) {
		
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
		
		record = {
			
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
		
	} else if (loadDataset == COOPER) {
		
		record = {
			
			title: function(d) {
				return d.title;
			},
			
			subtitle: function(d) {
				return d.provenance + "<br>" + d.date;
			},
			
			image: function(d) {
				return d.thumbnailUrl;
			}
			
		};
		
		fields = [
				{
				
					title: "Medium",
					accessor: function(d) {
						return d.medium;
					}
					
				},
				{
				
					title: "Decade",
					accessor: function(d) {
						return d.decade;
					}
					
				},
				{
				
					title: "Signed",
					accessor: function(d) {
						return d.signed;
					}
					
				},
				{
				
					title: "Markings",
					accessor: function(d) {
						return d.markings;
					}
					
				},
				{
				
					title: "Year Acquired",
					accessor: function(d) {
						return d.year_acquired;
					}
					
				}
			];
		
	} else if (loadDataset == TICTAC) {
		
		record = {
			
			title: function(d) {
				return d.product_name;
			},
			
			subtitle: function(d) {
				return d.coating + "<br>" + d.date_entered;
			},
			
			image: function(d) {
				return d.thumbnailUrl;
			}
			
		};
		
		fields = [
				{
				
					title: "Coating",
					accessor: function(d) {
						return d.coating;
					}
					
				},
				{
				
					title: "Country",
					accessor: function(d) {
						return d.country_of_origin;
					}
					
				},
				{
				
					title: "Marking",
					accessor: function(d) {
						return d.marking;
					}
					
				},
				{
				
					title: "Colour",
					accessor: function(d) {
						return d.colour;
					}
					
				},

				{
				
					title: "Plan",
					accessor: function(d) {
						return d.plan;
					}
					
				},
				{
				
					title: "Scoring",
					accessor: function(d) {
						return d.scoring;
					}
					
				}
			];
		
	} else if (loadDataset == OXFORD) {
		
		record = {
			
			title: function(d) {
				console.log( d );
				return "Vase #" + d["Record - Vase-Number"];
			},
			
			subtitle: function(d) {
				return d["Record - Date - From-Date"] + " &ndash; "  + d["Record - Date - To-Date"] + " (" + d["Record - Date-Range"] +  ")";
			},
			
			image: function(d) {
				return "";
			}
			
		};
		
		fields = [
				{
				
					title: "Technique",
					accessor: function(d) {
						return d["Record - Technique"];
					}
					
				},
				{
				
					title: "Collection",
					accessor: function(d) {
						return d["Record - Collection-Record - Collection - Collection-Name"];
					}
					
				},
				{
					title: "Fabric",
					accessor: function(d) {
						
						return d["Record - Fabric"];
						
					}
					
				}
			];
		
	}
	
	ui = TT.ui.panel().heap( heap ).fields( fields ).record( record ).initialise();

		
}
