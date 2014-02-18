# Set the source directory
srcdir = src/

start = ${srcdir}start.js
end = ${srcdir}end.js

# Create the list of modules paths
modules =	${srcdir}crossfilter/crossfilter.js\
				${srcdir}timeline/timeline.js\
				
# Create the list of dependencies
dependencies =	${srcdir}crossfilter/crossfilter.min.js\

# Build full list of files
files = ${start} ${modules} ${dependencies} ${end}
#files = ${core} ${modules} ${dependencies} ${initialisation}

# Set both to be built
#all: TT-dev.js

# Combine all of the files into spark-dev.js
TT-dev.js: ${files}
	cat > $@ $^
