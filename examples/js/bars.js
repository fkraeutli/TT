


BRITTEN 	= 0;
TATE 		= 1;
TATEART		= 2;
JOHNSTON 	= 3;

loadDataset = TATE ;

var currentYear = new Date().getFullYear(),
	dataset = [],
	bars,
	urls = ["data/works.js", "http://otis.local:8888/Tate/allartists.js", "http://otis.local:8888/Tate/allartworks.js", "http://otis.local:8888/ltm/data/Johnston-Data.json"];
	
$j = jQuery.noConflict();


d3.json(urls[loadDataset], function(error, data) {
		
	if(!error) {
		
		if(loadDataset === BRITTEN) {
				
			data = data.works;
		
			data.forEach(function(d) {
						
				if(d.date_completed_year) {
					
					d.to = new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
					
					if(d.date_commenced_year) {
						
						d.from = new Date(+d.date_commenced_year, +d.date_commenced_month - 1, +d.date_commenced_day);
						
					} else {
					
						d.from = new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
	
						d.from.setMonth(d.from.getMonth() - 1);
						
					}		
					d.date = d.from;
					d.id = d.catalogue_no.replace("/", "-");
					d.weight = 0;
					
					if(d.from > d.to) {
						
						d._from = d.from;
						d.from = d.to;
						d.to = d._from;
						
					}
					
					dataset.push(d);
				}
				
				var worksPerGenre = [];
	
				dataset.forEach( function(d) {
					
					var id = d.genre;
					
					if(worksPerGenre[id]) {
					
						d.weight = Math.min(500, worksPerGenre[id]);
						
					} else {
						
						worksPerGenre[id] = dataset.filter( function(e) {return e.genre == id;} ).length
						d.weight = Math.min(500, worksPerGenre[id]);
						
					}
					
				} )
				
				dataset.sort( function(a,b) { return b.from - a.from } )

			});
			
		}  else if (loadDataset === TATE) {
				
			data.forEach(function(d) {
	
				if(d.birth && d.birth.time) {
					d.yearOfBirth = new Date( +d.birth.time.startYear, 0, 1 );
					d.yearOfDeath = new Date( (d.death ? (d.death.time ? d.death.time.startYear : +d.birth.time.startYear + 80) : currentYear) , 0 , 1 ); // here I'm assuming a lifetime of 80 years (might extend to future)
					d.title		= d.fc;
					d.date		= d.yearOfBirth;
					d.from		= d.yearOfBirth;
					d.to		= d.yearOfDeath;
					d.weight	= d.totalWorks
				
					dataset.push(d);
				}
		
			});
			
		} else if (loadDataset === TATEART) {
						
			data.splice(0, 60000);
							
			var artistCount = {};
			
			data.forEach( function(d) {
				
				if(d.dateRange && d.dateRange != null && d.dateRange.startYear) {
					
					d.from = new Date( +d.dateRange.startYear, 0, 1 );
					
					if ( d.dateRange.endYear ) {
					
						d.to = new Date( +d.dateRange.endYear,0 ,1 );
						
					} else {
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );
					}
				
					if( artistCount.hasOwnProperty( d.all_artists ) ) {
						
						artistCount[d.all_artists]++;
						
					} else {

						artistCount[d.all_artists] = 0;
						
					}
					
					dataset.push(d);	
				}
				
			} );
			
			
			// determine importance
			
			dataset.forEach( function(d) {
				
				d.weight = artistCount[d.all_artists];
				
			} )
			
			
		} else if (loadDataset === JOHNSTON) {
			
			console.log(data.length);
			
			data.forEach( function(d) {
				
				for( var attribute in d ) {
					
					if( attribute.indexOf("date") != -1  && d[attribute] !== null) {
					
						d[attribute + "_orig"] = d[attribute];
						
						if(d[attribute].replace) {
							d[attribute] = d[attribute].replace(/BST/, "GMT");						
						}
						d[attribute] = new Date( d[attribute] );
						
					} else if( d[attribute] == +d[attribute] ) {
						
						d[attribute] = +d[attribute];
						
					}
					
				}
				
				d.title = d.simple_name || "unknown";
				d.date = d.production_date_from || new Date();
				
				if( d.date instanceof Date ) {
					
					d.id = d.inventory;
					d.from = d.date;
					
					if( d.production_date_to instanceof Date && d.from.valueOf() <= d.production_date_to.valueOf() ) {
					
						d.to = new Date( d.date.valueOf() );
						d.to.setFullYear( d.date.getFullYear() + 1 );		
						
					} else {
						
						d.to = d.production_date_to || new Date();
						
					}
					
					if( !isNaN( d.from.valueOf() ) && !isNaN( d.to.valueOf() )) {
						dataset.push(d);
					}
					
				}
				
				
			} );
			
			// Calculate weight by uniqueness of terms
			terms = Array();
			
			dataset.forEach( function(d) {
				
				if( !terms[d.title] ) {
				
					terms[d.title] = 1;
					
				} else {
				
					terms[d.title]++;
					
				}
				
			} );
			
			var minWeight = undefined, maxWeight = undefined;
			
			for(var i in terms) {
			
				if( minWeight === undefined || minWeight > terms[i] ) {
					
					minWeight = terms[i];
					
				}
				
				if( maxWeight === undefined || maxWeight < terms[i] ) {
					
					maxWeight = terms[i];
					
				}
			
			}
			
			var weightScale = d3.scale.linear()
				.domain( [minWeight, maxWeight] )
				.range( [1, 0]);
				
			dataset.forEach( function(d) {
				
				d.title = d.title;
				d.weight = weightScale( terms[d.title] );
				
			} );
			
			
		}
		
		make();
	
	} else {
	
		console.error(error);
		
	}
	
});	
	

function make() {

	cf = TT.crossfilter().data(dataset);
	
	if(loadDataset === TATE) {
	
		cf.addFilter({
			title: "Year born",
			dimension: "from", 
			group: d3.time.year 
		});
		
		cf.addFilter({
			title: "Age",
			dimension: function(d) {
				return d.to.getFullYear() - d.from.getFullYear();
			}
		});
		
		cf.addFilter({
			title: "Number of works in the Tate Collection",
			dimension: function(d) {
			
				//return Math.log(d.totalWorks);
				return d.totalWorks < 500 ? d.totalWorks : 500;
				
			}
		});

		cf.addFilter({
			dimension: function(d) {
				return d.gender || "unknown";
			},
			title: "Gender"
		});
		
		cf.addFilter( { 
			title: "Movement", 
			dimension: function(d) {
				if(d.movements.length) { 
					return d.movements[0].name;
				} else {
					return "unknown";
				}; 
			} 
		} )
	
	} else if (loadDataset === TATEART) {
		
		cf.addFilter({
			title: "Year",
			dimension: "from"
		});
		
		cf.addFilter({title: "Medium", dimension: "medium"});
		
		cf.addFilter({
			title: "Artist",
			dimension: function(d) { return d.contributors[0].fc; }
		});
		
	}	else if (loadDataset === BRITTEN) {
		
		cf.addFilter({
			title: "Started Composition",
			dimension: "from", 
			group: d3.time.year 
		});
			
		cf.addFilter({
			title: "Finished Composition",
			dimension: "to",
			group: d3.time.year
		});
			
		cf.addFilter({
		
			title: "Duration of composition",
			dimension: function(d) {
				return d.to - d.from
			},
			group: function(d) { return Math.floor(d / 100) * 100;}
		
		})
	} else if(loadDataset === JOHNSTON) {
	
		cf.addFilter({
			title: "Production date",
			dimension: "from", 
			group: d3.time.year
		});
		

		cf.addFilter({
			title: "Acquisition date",
			dimension: function(d) {
				return d.acquired_date_from || new Date();;
			}, 
			group: d3.time.year 
		});

		
		cf.addFilter({
			dimension: "weight", 
			group: function(d) { return Math.floor(d / 10) * 10;}
		});
		
		cf.addFilter( { 
			title: "Production Role", 
			dimension: function(d) {if(d.production_role) {return d.production_role.split(";")[0]} else {return "unknown"}; } 
		})
	}

	d3.select("#crossfilter")
		.call(cf);	
		
	TT.observer.make(cf);		

	timeline = TT.layout.bars().data(dataset);
	
	d3.select("svg#timeline")
		.attr("class", "timeline")
		.attr("width", 800)
		.attr("height", 900)
		.call(timeline);
	
	cf.addSubscriber(function(data) {
	
		timeline.data(data);
	
	})
	
	TT.observer.make(timeline);

	timeline.addSubscriber(function(displayData) {
		
		var shown = displayData.length;
		var hidden =  timeline.data().length - displayData.length;
		
		var message = "";
		
		if( hidden > 0) {
			message = shown + " artists in view (" + hidden + " more currently hidden)";
			$j("#leftCol").find(".status").show();
		} else {			
			message = shown + " artists in view";
			$j("#leftCol").find(".status").hide();
		}
		
		$j("#leftCol").find(".status").html(message);

	})
	
	$j("#resetLink").click( function(e) {
	
		e.preventDefault();

		cf.charts().forEach( function(chart) { 
			chart.reset();
		});
		
		timeline.zoom().translate([0,0]).scale(1);
		cf.forcePublish();
		
	})
	
	cf.forcePublish()	
}




function colourByAttribute(attribute, dataset) {
	
	var color;
	var values = listUniqueValues(attribute);
	var fillFunction;
		
	// pick color scale
	if (values.length <= 10) {
		color = d3.scale.category10();
	} else if (values.length <= 20) {
		color = d3.scale.category20();
	}

	if(values.length <= 20) {
		fillFunction = function(d) {
			var value;
			if(typeof attribute == "function") {
				value = attribute.call( attribute, d );
			} else {
				value = d[attribute];
			}
			return color(values.indexOf( value ) );
			
		}
	} else {
		fillFunction = function(d) {
		
			var step = 360/values.length,
				value;
			if(typeof attribute == "function") {
				value = attribute.call( attribute, d );
			} else {
				value = d[attribute];
			}
			
			return d3.hsl(values.indexOf( value ) * step, .5, .5);
			
		}
	}

	dataset.forEach(function(d) {
		
		d.color = fillFunction(d);
		
	})
	
	timeline.data(dataset);
	cf.forcePublish();
}

function colourByMovementName(dataset) {
	
	return colourByAttribute( function (d) {
		if(d.movements.length) { 
			return d.movements[0].name;
		} else {
			return "unknown";
		}; 

	}, dataset)
	
}

function listAttributes() {
	var keys = Object.keys(dataset[0]);
	console.log(keys);
}

function listDateAttributes() {
	var keys = Object.keys(dataset[0]);
	var dateKeys = [];
	for(i in keys) {
		if(keys[i].indexOf("date") != -1) {
			dateKeys.push(keys[i]);
		}
	}
	console.log(dateKeys);
}

function listUniqueValues(attribute) {
	var values = Array();
	
	for(i in dataset) {

		if(typeof attribute == "function") {
			
			var value = attribute.call(attribute, dataset[i]);
			
			if(values.indexOf(value) == -1) {
				values.push( value );
			}
			
		} else {
	
			if(values.indexOf(dataset[i][attribute]) == -1) {
				values.push(dataset[i][attribute])
			}
			
		}
	}
	values.sort();
	return values;
}

function sortByAttribute(attribute) {
	
	var vals = listUniqueValues(attribute);
	
	dataset.sort( function(a,b) {
		
		return vals.indexOf( b[attribute] ) - vals.indexOf( a[attribute] );
		
	} )
	
	timeline.data(dataset);
	//cf.forcePublish();

}
