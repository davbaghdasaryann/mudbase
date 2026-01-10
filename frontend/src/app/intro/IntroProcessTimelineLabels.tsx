// components/ProcessTimelineLabels.tsx
import { Box, Typography } from '@mui/material';

const labels = [
  {
    text: 'Օգտագործելով միասնական տվյալների շտեմարանները',
    pos: { top: '90%', left: '12%' },
  },
  {
    text: 'Վերլուծելով ստացված տվյալները',
    pos: { top: '10%', left: '34.5%' },
  },
  {
    text: 'Օգտագործելով արժեքի գնահատման հաշվիչը',
    pos: { top: '106%', left: '63.5%' },
  },
  {
    text: 'Համագործակցելով այլ կազմակերպությունների հետ',
    pos: { top: '-10%', left: '88.5%' },
  },
];

export default function ProcessTimelineLabels() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        width: '100vw',               
        left: '50%',                  
        transform: 'translateX(-50%)',
        m: 0,                         
        p: 0,                         
        background: "linear-gradient(to bottom, #ECF3F1, #E8F6F0, #E6F8F0)",
        overflow: 'visible',
      }}
    >
      <Box
        component="img"
        src="/images/intro/Group-469296.svg"
        alt="Process flow"
        sx={{
          display: 'block',
          width: '100vw',
          height: 'auto',
        }}
      />

      {labels.map((item, idx) => (
        <Typography
          key={idx}
          variant="body2"
          sx={{
            position: 'absolute',
            top: item.pos.top,
            left: item.pos.left,
            transform: 'translate(-50%, -50%)',
            maxWidth: 160,
            color: '#282828',
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {item.text}
        </Typography>
      ))}
    </Box>
  );
}




// // components/ProcessTimelineLabels.tsx
// import { Box, Typography } from '@mui/material';

// type Label = {
//   text: string;
//   vertical: 'top' | 'bottom';
//   offset: string; 
// };

// const labels: Label[] = [
//   {
//     text: 'Օգտագործելով մասնաճյուղի տվյալների ցուցիչները',
//     vertical: 'bottom',
//     offset: '40%',     // sits up 40% from bottom
//   },
//   {
//     text: 'Վերլուծելով ստացված տվյալները',
//     vertical: 'top',
//     offset: '12%',     // 12% down from top
//   },
//   {
//     text: 'Օգտագործելով առցանց հաշվիչը',
//     vertical: 'bottom',
//     offset: '-10%',    // **negative**: 10% BELOW the bottom edge
//   },
//   {
//     text: 'Համակարգելով այլ կազմակերպությունների հետ',
//     vertical: 'top',
//     offset: '12%',
//   },
// ];

// export default function ProcessTimelineLabels() {
//   return (
//     <Box
//       component="section"
//       sx={{
//         position: 'relative',
//         width: '100vw',
//         left: '50%',
//         transform: 'translateX(-50%)',
//         m: 0,
//         p: 0,
//         bgcolor: '#f7f9fa',
//         overflow: 'visible',  // allow negative to show
//       }}
//     >
//       {/* full-bleed SVG */}
//       <Box
//         component="img"
//         src="/images/intro/Group-469296.svg"
//         alt="Process flow"
//         sx={{
//           display: 'block',
//           width: '100%',
//           height: 'auto',
//         }}
//       />

//       {/* four columns */}
//       <Box
//         sx={{
//           position: 'absolute',
//           inset: 0,
//           display: 'flex',
//         }}
//       >
//         {labels.map(({ text, vertical, offset }, i) => (
//           <Box key={i} sx={{ flex: 1, position: 'relative' }}>
//             <Typography
//               variant="body2"
//               sx={{
//                 position: 'absolute',
//                 left: '50%',
//                 transform: 'translateX(-50%)',
//                 [vertical]: offset,   // either top: '12%' or bottom: '-10%'
//                 maxWidth: 160,
//                 color: '#282828',
//                 fontWeight: 500,
//                 textAlign: 'center',
//                 lineHeight: 1.4,
//               }}
//             >
//               {text}
//             </Typography>
//           </Box>
//         ))}
//       </Box>
//     </Box>
//   );
// }
