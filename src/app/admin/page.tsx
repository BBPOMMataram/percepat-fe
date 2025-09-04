"use client"
import axios from '@/utils/axios'
const AdminPage = () => {
    const handleClick = async () => {

        // const options = {
        //     method: 'POST',
        //     url: 'https://service-chat.qontak.com/api/open/v1/broadcasts/whatsapp/direct',
        //     headers: { 'Content-Type': 'application/json', Authorization: 'Bearer f4vsXB6uslHsFE0GVla1jWOS5JsfhNefJ3226w0EGqA' },
        //     data: {
        //         to_name: 'arfan test no tujuan API',
        //         to_number: '6281907456710',
        //         message_template_id: 'test message_template_id',
        //         channel_integration_id: 'test channel_integration_id',
        //         language: { code: 'en' },
        //         parameters: {
        //             header: {
        //                 format: 'DOCUMENT',
        //                 params: [
        //                     {
        //                         key: 'url',
        //                         value: 'https://qontak-hub-development.s3.amazonaws.com/uploads/direct/files/01417dc5-9cd1-40b7-8900-d8b9fd6f250e/sample.pdf'
        //                     },
        //                     { key: 'filename', value: 'sample.pdf' }
        //                 ]
        //             },
        //             body: [{ key: '1', value_text: 'Halo ini testing wa gateway nya qontak, dikirim dari web bpom', value: 'arfan' }],
        //             buttons: [{ index: '0', type: 'url', value: 'paymentUniqNumber' }]
        //         }
        //     }
        // };

        const options = {
            method: 'GET',
            url: 'https://api.mekari.com/qontak/chat/v1/templates/whatsapp',
            headers: {Accept: 'application/json', Authorization: 'Bearer f4vsXB6uslHsFE0GVla1jWOS5JsfhNefJ3226w0EGqA' }
          };

        try {
            const { data } = await axios.request(options);
            console.log(data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleLogout = async () => {
        await axios.post('logout').catch(err => console.log(err))
    }

    const handleTest = async () => {
        await axios.get('me')
        .then(res => console.log(res))
        .catch(err => console.log(err))
    }

    return (<div>
        <div>
        Admin page
        </div>
        <button onClick={handleLogout}>Logout</button>
        <br />
        <button onClick={handleTest}>Test</button>
        <br />
        <button className='bg-green-500 text-green-100 p-2 m-4 rounded' onClick={handleClick}>Send Qontak WA Gateway API</button>
    </div>
    )
}
export default AdminPage