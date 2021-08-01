# batscript
##### The unnecessary compiler for *.bat files
### Features
- .bats file with ~cpp like syntax compiled to .bat files
- functions (although no recursion is supported)
- difficult to understand output file
- missing a lot of native batch commands (TODO)

### Syntax
The following code prints out '25' in the console.
```
function main()
{
	var result = something(5, 10);

	echo(result);
}

function something(one, two)
{
	return one + somethingElse(two);
}

function somethingElse(argument)
{
	return 2 * argument;
}
```
### Usage
#### Compiling
The 'compiler' is written in Node.JS
```
cd batscript
node compile/compile.js <source filename.bats>
```
Example using attached 'example.bats' file
```
cd batscript
node compile/compile.js example.bats
example.bat
```
#### VS Code setup
For quick testing you can use the '[Run On Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave)' extension that will automatically compile any .bats file on save.
The extension's config is included in the repository.
