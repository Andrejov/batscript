@ECHO OFF
REM Assign begin 
SET __ret__0009_=
SET a=5
REM Assign begin 
SET __ret__0011_=
SET ____native_multiply__0007___a=%a%
SET ____native_multiply__0007___b=2
SET /A __ret_ntv__0013_=____native_multiply__0007___a*____native_multiply__0007___b
SET __ret__0011_=%__ret_ntv__0013_%
GOTO __gret__0012_
SET __ret__0011_=0
GOTO __gret__0012_
:__gret__0012_
REM Assign end
SET b=%__ret__0011_%
REM Assign begin 
SET __ret__0014_=
SET __echo__0008___val=%b%
ECHO %__echo__0008___val%
SET __ret__0014_=%__ret_ntv__0016_%
GOTO __gret__0015_
SET __ret__0014_=0
GOTO __gret__0015_
:__gret__0015_
REM Assign end
SET __ret__0009_=0
GOTO __gret__0010_
:__gret__0010_
REM Assign end