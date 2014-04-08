


BRITTEN 	= 0;
TATE 		= 1;
TATEART		= 2;
JOHNSTON 	= 3;

loadDataset = TATEART;

var currentYear = new Date().getFullYear(),
	dataset = [],
	heap,
	urls = ["data/works.js", "../../Tate/allartists.js", "../../Tate/artwork_data.csv", "../../ltm/data/Johnston-Data.json"];
	
$j = jQuery.noConflict();

if ( loadDataset !== TATEART ) {
	
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
					
					
	
				});
				
			}  else if (loadDataset === TATE) {
					
				data.forEach(function(d) {
		
					if(d.birth && d.birth.time) {
						d.yearOfBirth = new Date( +d.birth.time.startYear, 0, 1 );
						d.yearOfDeath = new Date( (d.death ? (d.death.time ? d.death.time.startYear : (+d.birth.time.startYear + 80 > currentYear ? currentYear : +d.birth.time.startYear + 80)) : currentYear) , 0 , 1 ); // here I'm assuming a lifetime of 80 years 
						d.title		= d.fc;
						d.date		= d.yearOfBirth;
						d.from		= d.yearOfBirth;
						d.to		= d.yearOfDeath;
						d.weight	= d.totalWorks
					
						dataset.push(d);
					}
			
				});
				
				
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
	
} else if (loadDataset === TATEART) {

	d3.csv(urls[loadDataset], function(error, data) {
	
		if( !error ) {
							
			var artistCount = {};
			
			data.forEach( function(d) {
				
				if(d.year) {
					
					d.from = new Date( +d.year, 0, 1 );
					
					d.to = new Date( d.from.valueOf() );
					d.to.setFullYear( d.from.getFullYear() + 1 );
				
					if ( !isNaN(d.from.valueOf()) ){// && d.artist != "Turner, Joseph Mallord William" ) {
						dataset.push(d);
					}
				}
				
			} );
			
			console.log( dataset.length + " instances" );			
			make();
			
		} else {
			
			console.error(error);
		
		}
	});
			
}	

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
			title: "Number of works (log)",
			dimension: function(d) {
			
				return Math.log(d.totalWorks);
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
		
		//cf.addFilter({title: "Medium", dimension: "medium"});
		
		cf.addFilter({
			dimension: "artist"
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
	
	heap = TT.layout.heap().data(dataset);
	
	
	if ( loadDataset == BRITTEN || loadDataset == TATE) {
		heap.styles.events("diameter", 4);
	}
	
	d3.select("svg#heap")
		.attr("class", "heap")
		.attr("width", $j("body").width())
		.attr("height", $j("body").height())
		.call(heap);
			
	
	cf.addSubscriber(function(data) {
		heap.data(data);
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
	
	heap.data(dataset);
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
	
	heap.data(dataset);
	//cf.forcePublish();

}
