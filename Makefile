# Set the source directory
srcdir = src/

start = ${srcdir}start.js
end = ${srcdir}end.js

# Create the list of modules paths
modules =	${srcdir}crossfilter/crossfilter.js\
				${srcdir}observer/observer.js\
				${srcdir}timeline/timeline.js\
				
# Create the list of dependencies

# Build full list of files
files = ${start} ${modules} ${end}
#files = ${core} ${modules} ${dependencies} ${initialisation}

# Set both to be built
#all: TT-dev.js

# Combine all of the files into spark-dev.js
TT-dev.js: ${files}
	cat > $@ $^
