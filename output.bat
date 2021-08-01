@ECHO OFF
REM Assign begin 
SET __ret__0006_=
REM Assign begin 
SET __ret__0008_=
SET ____native_add__0004___a=1
SET ____native_add__0004___b=1
SET /A __ret_ntv__0010_=____native_add__0004___a+____native_add__0004___b
SET __ret__0008_=%__ret_ntv__0010_%
GOTO __gret__0009_
SET __ret__0008_=0
GOTO __gret__0009_
:__gret__0009_
REM Assign end
SET a=%__ret__0008_%
REM Assign begin 
SET __ret__0011_=
SET __echo__0005___val=%a%
ECHO %__echo__0005___val%
SET __ret__0011_=%__ret_ntv__0013_%
GOTO __gret__0012_
SET __ret__0011_=0
GOTO __gret__0012_
:__gret__0012_
REM Assign end
SET __ret__0006_=0
GOTO __gret__0007_
:__gret__0007_
REM Assign end