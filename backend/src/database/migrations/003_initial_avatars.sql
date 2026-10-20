-- Remove apenas imagens predefinidas; conserva fotografias carregadas pelo utilizador.
UPDATE utilizadores SET url_avatar = NULL
WHERE url_avatar = '/avatar-default.svg'
   OR url_avatar LIKE 'https://api.dicebear.com/%'
   OR url_avatar IN ('https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&h=240&fit=crop&crop=faces&auto=format&q=80',
     'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=240&h=240&fit=crop&crop=faces&auto=format&q=80');
