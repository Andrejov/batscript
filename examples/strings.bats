var title=""
var titleString=""

function main()
{
	changeTitle("Hello!");
	while(1)
	{
		printBox();
		psleep(1);
	}
}

function changeTitle(newTitle)
{
	title = newTitle;
	titleString = padend(title, ' ', 18);
	settitle(newTitle);
}

function printBox()
{
	var time = env("time:~0,8");

	cls();
	echo("======================");
	echo("= " & titleString & " =");
	echo("======================");
	echo("= The time is:       =");
	echo("= " & padstart(time, ' ', 18) & " =");
	echo("======================");
}