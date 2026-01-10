import {Box} from '@mui/system';
import {PageContentsProps} from '../PageContents';
import ImgElement from '../../tsui/DomElements/ImgElement';
import Link from 'next/link';

export default function AppCentralCompanyLogo(props: PageContentsProps) {
    return (
        <Box 
            sx={{
                position: 'fixed',
                top: 50,
                left: 0,
                width: '100%',
                py: 2,
                textAlign: 'center',
            }}>

            {/* <ImgElement src='/images/mudbase_header_title.svg' sx={{height: 30}} /> */}
            <Link href="/login">
                <Box sx={{  cursor: 'pointer' }}>
                    {/* <ImgElement src="/images/mudbase_header_title.svg" sx={{ height: 30 }} /> */}
                    <ImgElement src="/images/mudbase_header_title.svg" sx={{ height: 45 }} />
                </Box>
            </Link>
        </Box>
    );
}
