var currentYear = new Date().getFullYear(),
	dataset = [],
	timeline = new Timeline();
	url = "data/works.js";
	

d3.json(url, function(error, data) {
		
	if(!error) {
			
		data = data.works;
	
		data.forEach(function(d) {
					
			if(d.date_completed_year) {
				
				d.to = new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
				
				if(d.date_commenced_year) {
					
					d.from = new Date(+d.date_commenced_year, +d.date_commenced_month - 1, +d.date_commenced_day);
					
				} else {
				
					d.from = new Date(+d.date_completed_year, +d.date_completed_month -1, +d.date_completed_day);

					d.from.setMonth(d.from.getMonth() - 1);
					
				}		
				d.date = d.from;
				d.id = d.catalogue_no;
				d.totalWorks = 0;
				
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
				
					d.totalWorks = Math.min(500, worksPerGenre[id]);
					
				} else {
					
					worksPerGenre[id] = dataset.filter( function(e) {return e.genre == id;} ).length
					d.totalWorks = Math.min(500, worksPerGenre[id]);
					
				}
				
			} )
			
			dataset.sort( function(a,b) { return b.from - a.from } )
			
		});
			

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
	