import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { spotifyApi } from '@/lib/spotify';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CreatePlaylistDialogProps {
  userId: string;
}

const CreatePlaylistDialog = ({ userId }: CreatePlaylistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setIsLoading(true);
    try {
      await spotifyApi(`/users/${userId}/playlists`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          public: isPublic,
        }),
      });

      toast.success('Playlist created successfully!');
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setOpen(false);
      setName('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-accent"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-accent border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add an optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-accent border-border resize-none"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="public" className="text-sm text-muted-foreground">
              Make playlist public
            </Label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !name.trim()}
            className="bg-primary hover:bg-spotify-green-hover"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistDialog;
