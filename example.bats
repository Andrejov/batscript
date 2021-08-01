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