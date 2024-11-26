import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material'

const Root = styled('div')(({ theme }) => {
  return {
    textAlign: 'center',
    paddingTop: theme.spacing(4),
  }
})

export default function HomePage() {
  const [open, setOpen] = React.useState(false)
  const handleClose = () => setOpen(false)
  const handleClick = () => setOpen(true)

  return (
    <React.Fragment>
      <Head>
        <title>Home - Medinfo (with-material-ui)</title>
      </Head>
      <Root>
        
        <Image
          src="/images/icon.png"
          alt="Logo image"
          width={256}
          height={256}
        />
        <Typography gutterBottom>
          <Button href="/analysis" variant="contained" color="secondary" >セミナー受講解析ページ</Button>
        </Typography>
      </Root>
    </React.Fragment>
  )
}
