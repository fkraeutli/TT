var currentYear = new Date().getFullYear(),
	dataset = [],
	timeline = new Timeline();
	url = "http://otis.local:8888/Tate/allartists.js";//data/works.js";
	

d3.json(url, function(error, data) {
		
	if(!error) {
			
		data.forEach(function(d) {

			if(d.birth && d.birth.time) {
				d.yearOfBirth = new Date( +d.birth.time.startYear, 0, 1 );
				d.yearOfDeath = new Date( (d.death ? (d.death.time ? d.death.time.startYear : +d.birth.time.startYear + 80) : currentYear) , 0 , 1 ); // here I'm assuming a lifetime of 80 years (might extend to future)
				d.title		= d.fc;
				d.date		= d.yearOfBirth;
				d.from		= d.yearOfBirth;
				d.to		= d.yearOfDeath;
				d.weight	= Math.min(300, d.totalWorks);
				
			
				dataset.push(d);
			}
	
		});
/*
		data = data.works;
	
		data.forEach(function(d) {
					
			if(d.date_completed_year) {
				
				d.to = new Date(+d.date_completed_year, +d.date_completed_month, +d.date_completed_day);
				
				if(d.date_commenced_year) {
					
					d.from = new Date(+d.date_commenced_year, +d.date_commenced_month, +d.date_commenced_day);
					
				} else {
				
					d.from = new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
					
				}		
				d.date = d.from;
				d.id = d.catalogue_no;
				
				dataset.push(d);
			}
			
			var worksPerGenre = [];

			dataset.forEach( function(d) {
				
				var id = d.genre;
				
				if(worksPerGenre[id]) {
				
					d.weight = Math.min(500, worksPerGenre[id]);
					
				} else {
					
					worksPerGenre[id] = dataset.filter( function(e) {return e.genre == id;} ).length
					
				}
				
			} )
			
		});
			
*/
		timeline.data(dataset);
		
		d3.select("body").insert("svg", ":first-child")
			.attr("id", "timeline")
			.attr("width", 1280)
			.attr("height", 600)
			.call(timeline);
	
	} else {
	
		console.log(error);
		
	}
	
});	
	