import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Film } from "lucide-react";

const userVideos = [
  { id: 'v1', title: 'My First Sci-Fi Short', duration: '5:42', date: '2024-05-10' },
  { id: 'v2', title: 'Exploring New Planets', duration: '12:15', date: '2024-05-08' },
  { id: 'v3', title: 'AI Companion Showcase', duration: '8:30', date: '2024-05-05' },
  { id: 'v4', title: 'Building a Spaceship in 30 Days', duration: '25:11', date: '2024-04-20' },
];

export default function VideoBankPage() {
  return (
    <div className="container mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-bold">Video Bank</h1>
          <p className="text-muted-foreground text-lg">
            Manage your deposited and withdrawn videos.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Deposit Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit a new video</DialogTitle>
                <DialogDescription>
                  Add a new video to your personal bank by providing its URL.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="video-url" className="text-right">Video URL</Label>
                  <Input id="video-url" placeholder="https://youtube.com/watch?v=..." className="col-span-3" />
                </div>
                <Button type="submit" className="w-full">Confirm Deposit</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Minus className="mr-2 h-4 w-4" /> Withdraw Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw a video</DialogTitle>
                <DialogDescription>
                  Select a video from your bank to withdraw.
                </DialogDescription>
              </DialogHeader>
               <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">Select a video from the table to withdraw.</p>
                <Button type="submit" variant="destructive" className="w-full">Confirm Withdraw</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Video Player Example</CardTitle>
          <CardDescription>
            This is how a video from your `public` folder would be displayed. Upload a video to `public/videos/sample-video.mp4` to see it here.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full aspect-video bg-black rounded-b-lg overflow-hidden">
            <video
              className="w-full h-full"
              controls
              src="/videos/sample-video.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Collection</CardTitle>
          <CardDescription>A list of all videos in your bank.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date Deposited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userVideos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <div className="bg-muted p-2 rounded-md flex items-center justify-center">
                      <Film className="h-5 w-5 text-muted-foreground"/>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>{video.duration}</TableCell>
                  <TableCell>{video.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
