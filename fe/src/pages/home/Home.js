import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components'
import { Button, message, Table } from 'antd';
import { BaseURL } from '../../config';
import axios from 'axios';

const Home = () => {

  const [authorized, setAuthorized] = useState(false);
  const [emails, setEmails] = useState([])
  const [open, setOpen] = useState(false)

  const handleAuthorize = async () => {
    try {
      const { data } = await axios.get(`/auth`);
      const popupWidth = 600;
      const popupHeight = 400;
      const left = (window.screen.width / 2) - (popupWidth / 2);
      const top = (window.screen.height / 2) - (popupHeight / 2);
      const popup = window.open(data.data, '_blank', `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
      setOpen(true)

      const checkPopupClosed = setInterval(() => {
        if (popup?.closed) {
          setOpen(false)
          clearInterval(checkPopupClosed);
          setAuthorized(true)
          message.success('Authorization Successful');
        }
      }, 1000);
    } catch (error) {
      setAuthorized(false)
      message.error('Authorization Failed');
      console.error(error);
    }
  }

  const getEmails = async () => {
    try {
      const { data } = await axios.get(`/emails`);
      if (data.success) {
        console.log("🚀 => data.data:", data.data);
        setEmails(data.data)
      }
    } catch (error) {
      message.error('Failed to fetch emails');
      console.error(error);
    }
  }
  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`/authorized`);
      console.log("🚀 => data:", data);
      if (data.data) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
        handleAuthorize()
      }
    } catch (error) {
      setAuthorized(false)
      message.error('Failed to fetch emails');
      console.error(error);
    }
  }

  const columns = [
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      width: '50%',
      align: 'center'
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: '50%',
      align: 'center'
    },
  ];

  useEffect(() => {
    if (!open) {
      checkAuth();
    }
  }, [open]);  //eslint-disable-line

  return (
    <div>
      <Navbar />
      <div className="flex items-center gap-4 justify-center m-12 py-8 border rounded-lg">
        <Button onClick={checkAuth}>{authorized ? 'Refresh' : 'Authorize'}</Button>
        <Button onClick={getEmails}>{'Get Your Mails'}</Button>
      </div>
      <div className="flex items-center gap-4 justify-center m-12 py-8">
        <Table columns={columns} dataSource={emails} bordered className='w-full'/>
      </div>
    </div>
  )
}

export default Home;
