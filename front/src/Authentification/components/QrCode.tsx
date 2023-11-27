import { User } from "../../types/User.interface";
import QRCode from 'react-qr-code';
import '../styles/QrCode.css';
interface QrCodeProps {
    props: User;
}

function QrCode({props}: QrCodeProps) {

    const accountName = props.username;
    const issuer = props.email;
    const secretKey = props.secret;

    if (!secretKey) {
        return null;
    }
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${encodeURIComponent(secretKey)}&issuer=${encodeURIComponent(issuer)}`;

    
    return(
        <div className="QrComp">
            <QRCode className="qrCode" value={otpAuthUrl}/>
        </div>
    )
}
export default QrCode;