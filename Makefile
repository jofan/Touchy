build: 
	@component build -o ./dist -s touchy -n touchy

clean:
	rm -fr dist

.PHONY: clean