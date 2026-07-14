'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

const TEAL = '#00ABBE';
const SKYLINE_COLOR = 'rgba(0,171,190,0.13)';
const SKYLINE_DARK  = 'rgba(0,171,190,0.19)';
const SKYLINE_WIN   = 'rgba(0,171,190,0.09)';

function CitySkyline() {
    return (
        <Box component='svg' viewBox='0 0 1440 280' preserveAspectRatio='xMidYMax meet'
            sx={{ width: '100%', display: 'block' }}
            xmlns='http://www.w3.org/2000/svg'>

            {/* ── LEFT CLUSTER ── */}
            {/* Short bldg */}
            <rect x='0' y='200' width='55' height='80' fill={SKYLINE_COLOR}/>
            <rect x='6' y='208' width='8' height='10' fill={SKYLINE_WIN}/> <rect x='18' y='208' width='8' height='10' fill={SKYLINE_WIN}/> <rect x='30' y='208' width='8' height='10' fill={SKYLINE_WIN}/>
            <rect x='6' y='224' width='8' height='10' fill={SKYLINE_WIN}/> <rect x='18' y='224' width='8' height='10' fill={SKYLINE_WIN}/> <rect x='30' y='224' width='8' height='10' fill={SKYLINE_WIN}/>
            <rect x='6' y='240' width='8' height='10' fill={SKYLINE_WIN}/> <rect x='18' y='240' width='8' height='10' fill={SKYLINE_WIN}/> <rect x='30' y='240' width='8' height='10' fill={SKYLINE_WIN}/>
            {/* Tall bldg */}
            <rect x='58' y='100' width='75' height='180' fill={SKYLINE_DARK}/>
            <rect x='65' y='112' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='80' y='112' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='95' y='112' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='110' y='112' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='65' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='80' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='95' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='110' y='132' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='65' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='80' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='95' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='110' y='152' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='65' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='80' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='95' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='110' y='172' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='65' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='80' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='95' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='110' y='192' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='65' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='80' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='95' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='110' y='212' width='10' height='14' fill={SKYLINE_WIN}/>
            {/* Medium bldg */}
            <rect x='136' y='150' width='50' height='130' fill={SKYLINE_COLOR}/>
            <rect x='143' y='160' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='155' y='160' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='167' y='160' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='143' y='178' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='155' y='178' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='167' y='178' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='143' y='196' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='155' y='196' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='167' y='196' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='143' y='214' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='155' y='214' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='167' y='214' width='8' height='12' fill={SKYLINE_WIN}/>
            {/* Crane 1 */}
            <rect x='192' y='30' width='5' height='120' fill={SKYLINE_COLOR}/>
            <rect x='135' y='30' width='62' height='5' fill={SKYLINE_COLOR}/>
            <rect x='192' y='30' width='80' height='5' fill={SKYLINE_COLOR}/>
            <rect x='268' y='35' width='3' height='25' fill={SKYLINE_COLOR}/>
            <rect x='152' y='35' width='2' height='40' fill={SKYLINE_COLOR}/>

            {/* ── CENTER-LEFT ── */}
            <rect x='200' y='130' width='65' height='150' fill={SKYLINE_DARK}/>
            <rect x='208' y='142' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='224' y='142' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='240' y='142' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='208' y='162' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='224' y='162' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='240' y='162' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='208' y='182' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='224' y='182' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='240' y='182' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='208' y='202' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='224' y='202' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='240' y='202' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='208' y='222' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='224' y='222' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='240' y='222' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='268' y='170' width='45' height='110' fill={SKYLINE_COLOR}/>
            <rect x='275' y='180' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='289' y='180' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='275' y='198' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='289' y='198' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='275' y='216' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='289' y='216' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='316' y='120' width='58' height='160' fill={SKYLINE_DARK}/>
            <rect x='323' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='338' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='353' y='132' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='323' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='338' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='353' y='152' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='323' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='338' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='353' y='172' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='323' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='338' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='353' y='192' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='323' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='338' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='353' y='212' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='378' y='190' width='40' height='90' fill={SKYLINE_COLOR}/>
            <rect x='385' y='200' width='7' height='10' fill={SKYLINE_WIN}/> <rect x='397' y='200' width='7' height='10' fill={SKYLINE_WIN}/>
            <rect x='385' y='216' width='7' height='10' fill={SKYLINE_WIN}/> <rect x='397' y='216' width='7' height='10' fill={SKYLINE_WIN}/>

            {/* ── CENTER ── */}
            {/* Very tall tower */}
            <rect x='420' y='50' width='80' height='230' fill={SKYLINE_DARK}/>
            <rect x='428' y='62' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='62' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='62' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='62' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='84' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='84' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='84' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='84' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='106' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='106' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='106' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='106' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='128' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='128' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='128' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='128' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='150' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='150' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='150' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='150' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='172' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='172' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='172' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='172' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='194' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='194' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='194' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='194' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='428' y='216' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='446' y='216' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='464' y='216' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='480' y='216' width='12' height='16' fill={SKYLINE_WIN}/>
            {/* Crane 2 — center */}
            <rect x='455' y='0' width='6' height='52' fill={SKYLINE_COLOR}/>
            <rect x='390' y='0' width='71' height='5' fill={SKYLINE_COLOR}/>
            <rect x='461' y='0' width='90' height='5' fill={SKYLINE_COLOR}/>
            <rect x='546' y='5' width='3' height='30' fill={SKYLINE_COLOR}/>
            <rect x='405' y='5' width='2' height='45' fill={SKYLINE_COLOR}/>
            <rect x='502' y='100' width='50' height='180' fill={SKYLINE_COLOR}/>
            <rect x='510' y='112' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='525' y='112' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='538' y='112' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='510' y='130' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='525' y='130' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='538' y='130' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='510' y='148' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='525' y='148' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='538' y='148' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='510' y='166' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='525' y='166' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='538' y='166' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='510' y='184' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='525' y='184' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='538' y='184' width='9' height='12' fill={SKYLINE_WIN}/>

            {/* ── CENTER-RIGHT ── */}
            <rect x='555' y='160' width='45' height='120' fill={SKYLINE_DARK}/>
            <rect x='563' y='170' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='577' y='170' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='581' y='170' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='563' y='188' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='577' y='188' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='563' y='206' width='8' height='12' fill={SKYLINE_WIN}/> <rect x='577' y='206' width='8' height='12' fill={SKYLINE_WIN}/>
            <rect x='603' y='90' width='70' height='190' fill={SKYLINE_DARK}/>
            <rect x='611' y='102' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='628' y='102' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='645' y='102' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='657' y='102' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='611' y='123' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='628' y='123' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='645' y='123' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='657' y='123' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='611' y='144' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='628' y='144' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='645' y='144' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='657' y='144' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='611' y='165' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='628' y='165' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='645' y='165' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='657' y='165' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='611' y='186' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='628' y='186' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='645' y='186' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='657' y='186' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='611' y='207' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='628' y='207' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='645' y='207' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='657' y='207' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='676' y='140' width='50' height='140' fill={SKYLINE_COLOR}/>
            <rect x='683' y='152' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='698' y='152' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='713' y='152' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='683' y='170' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='698' y='170' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='713' y='170' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='683' y='188' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='698' y='188' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='713' y='188' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='683' y='206' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='698' y='206' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='713' y='206' width='9' height='12' fill={SKYLINE_WIN}/>

            {/* ── RIGHT-CENTER ── */}
            <rect x='730' y='110' width='60' height='170' fill={SKYLINE_DARK}/>
            <rect x='738' y='122' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='754' y='122' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='769' y='122' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='738' y='142' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='754' y='142' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='769' y='142' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='738' y='162' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='754' y='162' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='769' y='162' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='738' y='182' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='754' y='182' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='769' y='182' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='738' y='202' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='754' y='202' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='769' y='202' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='793' y='175' width='42' height='105' fill={SKYLINE_COLOR}/>
            <rect x='800' y='185' width='8' height='11' fill={SKYLINE_WIN}/> <rect x='814' y='185' width='8' height='11' fill={SKYLINE_WIN}/> <rect x='824' y='185' width='8' height='11' fill={SKYLINE_WIN}/>
            <rect x='800' y='202' width='8' height='11' fill={SKYLINE_WIN}/> <rect x='814' y='202' width='8' height='11' fill={SKYLINE_WIN}/> <rect x='824' y='202' width='8' height='11' fill={SKYLINE_WIN}/>
            <rect x='838' y='130' width='65' height='150' fill={SKYLINE_DARK}/>
            <rect x='846' y='142' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='863' y='142' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='880' y='142' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='846' y='163' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='863' y='163' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='880' y='163' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='846' y='184' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='863' y='184' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='880' y='184' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='846' y='205' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='863' y='205' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='880' y='205' width='11' height='15' fill={SKYLINE_WIN}/>

            {/* ── RIGHT ── */}
            <rect x='906' y='155' width='48' height='125' fill={SKYLINE_COLOR}/>
            <rect x='914' y='166' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='929' y='166' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='942' y='166' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='914' y='184' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='929' y='184' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='942' y='184' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='914' y='202' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='929' y='202' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='942' y='202' width='9' height='12' fill={SKYLINE_WIN}/>
            {/* Crane 3 */}
            <rect x='955' y='25' width='5' height='130' fill={SKYLINE_COLOR}/>
            <rect x='893' y='25' width='67' height='5' fill={SKYLINE_COLOR}/>
            <rect x='960' y='25' width='75' height='5' fill={SKYLINE_COLOR}/>
            <rect x='1030' y='30' width='3' height='28' fill={SKYLINE_COLOR}/>
            <rect x='907' y='30' width='2' height='42' fill={SKYLINE_COLOR}/>
            <rect x='957' y='155' width='70' height='125' fill={SKYLINE_DARK}/>
            <rect x='965' y='167' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='982' y='167' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='1000' y='167' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='965' y='188' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='982' y='188' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='1000' y='188' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='965' y='209' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='982' y='209' width='11' height='15' fill={SKYLINE_WIN}/> <rect x='1000' y='209' width='11' height='15' fill={SKYLINE_WIN}/>
            <rect x='1030' y='120' width='55' height='160' fill={SKYLINE_COLOR}/>
            <rect x='1038' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1054' y='132' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1068' y='132' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1038' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1054' y='152' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1068' y='152' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1038' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1054' y='172' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1068' y='172' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1038' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1054' y='192' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1068' y='192' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1038' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1054' y='212' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1068' y='212' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1088' y='180' width='40' height='100' fill={SKYLINE_COLOR}/>
            <rect x='1095' y='190' width='8' height='11' fill={SKYLINE_WIN}/> <rect x='1109' y='190' width='8' height='11' fill={SKYLINE_WIN}/>
            <rect x='1095' y='207' width='8' height='11' fill={SKYLINE_WIN}/> <rect x='1109' y='207' width='8' height='11' fill={SKYLINE_WIN}/>

            {/* ── FAR RIGHT ── */}
            <rect x='1130' y='100' width='72' height='180' fill={SKYLINE_DARK}/>
            <rect x='1138' y='112' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1156' y='112' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1174' y='112' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='1138' y='134' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1156' y='134' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1174' y='134' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='1138' y='156' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1156' y='156' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1174' y='156' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='1138' y='178' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1156' y='178' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1174' y='178' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='1138' y='200' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1156' y='200' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1174' y='200' width='12' height='16' fill={SKYLINE_WIN}/>
            <rect x='1138' y='222' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1156' y='222' width='12' height='16' fill={SKYLINE_WIN}/> <rect x='1174' y='222' width='12' height='16' fill={SKYLINE_WIN}/>
            {/* Crane 4 — far right */}
            <rect x='1200' y='20' width='5' height='82' fill={SKYLINE_COLOR}/>
            <rect x='1150' y='20' width='55' height='5' fill={SKYLINE_COLOR}/>
            <rect x='1205' y='20' width='70' height='5' fill={SKYLINE_COLOR}/>
            <rect x='1270' y='25' width='3' height='25' fill={SKYLINE_COLOR}/>
            <rect x='1163' y='25' width='2' height='38' fill={SKYLINE_COLOR}/>
            <rect x='1205' y='102' width='60' height='178' fill={SKYLINE_COLOR}/>
            <rect x='1213' y='114' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1229' y='114' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1245' y='114' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1213' y='134' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1229' y='134' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1245' y='134' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1213' y='154' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1229' y='154' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1245' y='154' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1213' y='174' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1229' y='174' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1245' y='174' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1213' y='194' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1229' y='194' width='10' height='14' fill={SKYLINE_WIN}/> <rect x='1245' y='194' width='10' height='14' fill={SKYLINE_WIN}/>
            <rect x='1268' y='170' width='50' height='110' fill={SKYLINE_DARK}/>
            <rect x='1276' y='182' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='1291' y='182' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='1306' y='182' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='1276' y='200' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='1291' y='200' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='1306' y='200' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='1320' y='210' width='55' height='70' fill={SKYLINE_COLOR}/>
            <rect x='1328' y='220' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='1343' y='220' width='9' height='12' fill={SKYLINE_WIN}/> <rect x='1358' y='220' width='9' height='12' fill={SKYLINE_WIN}/>
            <rect x='1378' y='185' width='62' height='95' fill={SKYLINE_DARK}/>
            <rect x='1385' y='196' width='10' height='13' fill={SKYLINE_WIN}/> <rect x='1401' y='196' width='10' height='13' fill={SKYLINE_WIN}/> <rect x='1415' y='196' width='10' height='13' fill={SKYLINE_WIN}/>
            <rect x='1385' y='215' width='10' height='13' fill={SKYLINE_WIN}/> <rect x='1401' y='215' width='10' height='13' fill={SKYLINE_WIN}/> <rect x='1415' y='215' width='10' height='13' fill={SKYLINE_WIN}/>

            {/* Ground baseline */}
            <rect x='0' y='278' width='1440' height='2' fill={SKYLINE_COLOR}/>
        </Box>
    );
}

export default function HeroSection() {
    const { i18n } = useTranslation();
    const isAm = i18n.language === 'am';

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            pt: 12,
            pb: 0,
            overflow: 'hidden',
        }}>
            {/* M Logo */}
            <Box sx={{ mb: 5 }}>
                <Image src='/images/logo_square.svg' alt='Mudbase' width={130} height={130} priority />
            </Box>

            {/* Headline */}
            <Box sx={{ textAlign: 'center', maxWidth: 700, px: 3 }}>
                <Typography
                    sx={{
                        fontWeight: 700,
                        lineHeight: 1.55,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                        color: '#1a2e35',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {isAm ? (
                        <>
                            Շինарարական աշխատանքների{' '}
                            <Box component='span' sx={{ color: TEAL }}>արժեքի</Box>
                            {' '}հաշվարկման և վերլուծության
                            <br />
                            էլեկտրոնային համակարգ
                        </>
                    ) : (
                        <>
                            Electronic System for Construction Works
                            <br />
                            <Box component='span' sx={{ color: TEAL }}>Cost</Box>
                            {' '}Calculation and Analysis
                        </>
                    )}
                </Typography>
            </Box>

            {/* City skyline — anchored at bottom */}
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
                <CitySkyline />
            </Box>
        </Box>
    );
}
