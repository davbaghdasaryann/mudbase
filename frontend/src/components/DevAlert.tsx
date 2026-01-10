import YAML from 'yaml';
import Swal from 'sweetalert2';

const escapeHtml = (unsafe: string) => {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

export function showDevAlert(obj: any, title?: string) {
    // alert(JSON.stringify(obj, null, 2));
    const yamlStr = YAML.stringify(obj);
    const escapedStr = escapeHtml(yamlStr);

    // alert(yamlStr);
    const backgroundColor = '#f4f4f4';

    Swal.fire({
        title: title,
        // text: yamlStr,
        html: `<pre style="text-align: left; background: ${backgroundColor}; padding: 10px; border-radius: 4px; overflow-x: auto;">${escapeHtml(escapedStr)}</pre>`,
        icon: 'info',
        confirmButtonText: 'Ok',
        animation: true,
        width: '600px',
        background: backgroundColor,
    });
}
