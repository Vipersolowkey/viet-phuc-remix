import io
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).parent))
from PIL import Image
from fastapi.testclient import TestClient
import server
from engine import check_mask,decode_image,blend_result

def image_bytes(color="white",size=(128,192),mode="RGB"):
    buffer=io.BytesIO();Image.new(mode,size,color).save(buffer,format="PNG");return buffer.getvalue()

class ImageTests(unittest.TestCase):
    def test_original_face_and_background_survive_compositing(self):
        original=Image.new('RGB',(128,192),'blue');generated=Image.new('RGB',original.size,'red')
        mask=Image.new('L',original.size,0);mask.paste(255,(20,50,110,180))
        foreground=Image.new('L',original.size,0);foreground.paste(255,(35,30,90,175))
        output=blend_result(generated,original,mask,foreground)
        self.assertEqual(output.getpixel((60,20)),original.getpixel((60,20)))
        self.assertEqual(output.getpixel((25,100)),original.getpixel((25,100)))
        self.assertEqual(output.getpixel((60,100)),generated.getpixel((60,100)))
    def test_reject_spoofed_and_invalid_dimensions(self):
        with self.assertRaises(Exception):decode_image(b"<svg />")
        with self.assertRaises(ValueError):decode_image(image_bytes(size=(12,12)))
    def test_empty_full_and_wrong_size_masks(self):
        person=Image.new("RGB",(128,192));
        for mask in [Image.new("L",(128,192),0),Image.new("L",(128,192),255),Image.new("L",(128,128),128)]:
            with self.assertRaises(ValueError):check_mask(person,mask)
        mask=Image.new("L",(128,192),0);mask.paste(255,(30,40,100,170));check_mask(person,mask)

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.env=patch.dict(os.environ,{"TRYON_API_KEY":"x"*40});self.env.start()
        self.client=TestClient(server.app);server.ready=True;server.attempts.clear()
        self.headers={"authorization":"Bearer "+"x"*40,"x-tryon-user":"a"*64}
    def tearDown(self):self.env.stop();server.ready=False
    def files(self):
        mask=Image.new("L",(128,192),0);mask.paste(255,(30,40,100,170));out=io.BytesIO();mask.save(out,format="PNG")
        return {"person":("person.png",image_bytes(),"image/png"),"garment":("garment.png",image_bytes(),"image/png"),"mask":("mask.png",out.getvalue(),"image/png")}
    def test_authentication_and_not_ready(self):
        self.assertEqual(self.client.get('/health').status_code,401)
        self.assertEqual(self.client.post('/try-on',files=self.files()).status_code,401)
        server.ready=False;self.assertEqual(self.client.post('/try-on',headers=self.headers,files=self.files()).status_code,503)
    def test_real_image_contract_with_mocked_gpu(self):
        with patch.object(server.engine,'infer',return_value=image_bytes('red')) as infer:
            response=self.client.post('/try-on',headers=self.headers,files=self.files())
            self.assertEqual(response.status_code,200);self.assertEqual(response.headers['content-type'],'image/png');self.assertEqual(response.headers['cache-control'],'no-store');infer.assert_called_once()
    def test_blocked_output_is_an_error_not_a_warning_image(self):
        with patch.object(server.engine,'infer',side_effect=server.OutputRejected()):
            response=self.client.post('/try-on',headers=self.headers,files=self.files())
            self.assertEqual(response.status_code,422)
            self.assertEqual(response.json(),{'error':'output_rejected'})
            self.assertFalse(response.headers['content-type'].startswith('image/'))
    def test_corrupt_image_and_user_hash(self):
        files=self.files();files['person']=('person.png',b'not an image','image/png')
        self.assertEqual(self.client.post('/try-on',headers=self.headers,files=files).status_code,400)
        self.assertEqual(self.client.post('/try-on',headers={'authorization':self.headers['authorization']},files=self.files()).status_code,401)
    def test_quota_and_failed_inference(self):
        with patch.object(server.engine,'infer',return_value=image_bytes()):
            for _ in range(6):self.assertEqual(self.client.post('/try-on',headers=self.headers,files=self.files()).status_code,200)
            self.assertEqual(self.client.post('/try-on',headers=self.headers,files=self.files()).status_code,429)
        server.attempts.clear()
        with patch.object(server.engine,'infer',side_effect=RuntimeError('GPU failed')):
            response=self.client.post('/try-on',headers=self.headers,files=self.files());self.assertEqual(response.status_code,502);self.assertEqual(response.json(),{'error':'inference_failed'})

if __name__=='__main__':unittest.main()
