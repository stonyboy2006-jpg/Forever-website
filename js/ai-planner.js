var AIWeddingPlanner = {
  categories: {
    timeline: {
      label: 'Wedding Timeline',
      desc: 'Generate a personalized wedding day timeline',
      icon: 'fa-clock',
      generate: function() {
        var d = AIWeddingPlanner.getWeddingData();
        var time = d.weddingTime || d.time || '14:00';
        return [
          { time: AIWeddingPlanner.addMins(time, -120), event: 'Bridal Preparation & Hair Styling', note: 'Bride & bridesmaids getting ready' },
          { time: AIWeddingPlanner.addMins(time, -90), event: 'Groom & Groomsmen Preparation', note: 'Groom & groomsmen suit up' },
          { time: AIWeddingPlanner.addMins(time, -60), event: 'Photography — Getting Ready', note: 'Capturing preparation moments' },
          { time: time, event: 'Wedding Ceremony Begins', note: 'Main ceremony at ' + (d.venue || 'the venue') },
          { time: AIWeddingPlanner.addMins(time, 60), event: 'Ceremony Concludes', note: 'Confetti toss & group photos' },
          { time: AIWeddingPlanner.addMins(time, 90), event: 'Cocktail Hour & Canapés', note: 'Guests enjoy refreshments' },
          { time: AIWeddingPlanner.addMins(time, 150), event: 'Grand Entrance', note: 'Couple introduced to reception' },
          { time: AIWeddingPlanner.addMins(time, 165), event: 'First Dance', note: 'Couple\'s first dance as married' },
          { time: AIWeddingPlanner.addMins(time, 180), event: 'Dinner Service Begins', note: 'Multi-course wedding meal' },
          { time: AIWeddingPlanner.addMins(time, 210), event: 'Speeches & Toasts', note: 'Best man, maid of honor, parents' },
          { time: AIWeddingPlanner.addMins(time, 240), event: 'Cake Cutting', note: 'Traditional cake cutting ceremony' },
          { time: AIWeddingPlanner.addMins(time, 270), event: 'Open Dance Floor', note: 'DJ/Live band entertainment' },
          { time: AIWeddingPlanner.addMins(time, 330), event: 'Bouquet & Garter Toss', note: 'Traditional wedding games' },
          { time: AIWeddingPlanner.addMins(time, 360), event: 'Grand Finale & Send-off', note: 'Sparkler exit / grand departure' }
        ];
      }
    },
    decoration: {
      label: 'Decoration Ideas',
      desc: 'AI-suggested wedding decoration themes',
      icon: 'fa-palette',
      generate: function() {
        var ideas = [
          { name: 'Classic Elegance', palette: 'Ivory, Gold, Champagne', elements: 'Crystal chandeliers, tall floral centerpieces, gold-rimmed glassware, white draping, candlelit tables' },
          { name: 'Rustic Romance', palette: 'Blush, Sage, Cream', elements: 'Barn venue, fairy lights, burlap runners, wildflower bouquets, wooden signage, mason jars' },
          { name: 'Modern Minimalist', palette: 'White, Black, Gold', elements: 'Clean lines, geometric shapes, monochromatic florals, acrylic signage, sleek furniture' },
          { name: 'Tropical Paradise', palette: 'Coral, Teal, Gold', elements: 'Monstera leaves, orchids, palm fronds, colorful cocktails, bamboo accents, tiki torches' },
          { name: 'Garden Enchantment', palette: 'Lavender, Sage, Blush', elements: 'Floral arches, hanging greenery, butterfly releases, vintage lanterns, garden games' },
          { name: 'Glamorous Hollywood', palette: 'Gold, Black, Red', elements: 'Velvet seating, gold sequins, dramatic lighting, red carpet entrance, Art Deco details' },
          { name: 'Bohemian Dream', palette: 'Terracotta, Mustard, Ivory', elements: 'Macrame backdrops, pampas grass, floor cushions, dreamcatchers, tribal patterns' },
          { name: 'African Heritage', palette: 'Gold, Ankara prints, Green', elements: 'Kente cloth accents, coral beads, wooden carvings, traditional drummers, vibrant headpieces' }
        ];
        return ideas[Math.floor(Math.random() * ideas.length)];
      }
    },
    palette: {
      label: 'Color Palettes',
      desc: 'Sophisticated wedding color schemes',
      icon: 'fa-swatchbook',
      generate: function() {
        var palettes = [
          { name: 'Champagne & Blush', colors: ['#F7E7CE', '#F5C6D0', '#D4AF37', '#8B7355', '#FAF0E6'] },
          { name: 'Midnight & Gold', colors: ['#0B0F19', '#D4AF37', '#1A1A2E', '#F7E7CE', '#2D2D44'] },
          { name: 'Sage & Ivory', colors: ['#B2BFA3', '#F8F5F0', '#8A9A7B', '#D4C9B3', '#E8E0D0'] },
          { name: 'Dusty Rose & Navy', colors: ['#B76E79', '#1B2838', '#D4A5A5', '#2C3E50', '#F5E6E0'] },
          { name: 'Emerald & Gold', colors: ['#0B2E2B', '#D4AF37', '#1A4A3E', '#F7E7CE', '#2D6A4F'] },
          { name: 'Lavender & Pearl', colors: ['#9B8EC4', '#F0E6FF', '#7B6BAE', '#E8D5F5', '#C4B5E0'] },
          { name: 'Terracotta & Cream', colors: ['#C76D4E', '#FFF5EE', '#E8996E', '#F5DEB3', '#8B5E3C'] },
          { name: 'Royal Blue & Silver', colors: ['#1E3A5F', '#C0C0C0', '#2C5282', '#E8E8E8', '#4A6FA5'] }
        ];
        return palettes[Math.floor(Math.random() * palettes.length)];
      }
    },
    music: {
      label: 'Music Playlist',
      desc: 'Curated wedding playlist suggestions',
      icon: 'fa-music',
      generate: function() {
        return {
          ceremony: [
            'Canon in D — Pachelbel', 'A Thousand Years — Instrumental', 'Marry Me — Train', 'All of Me — John Legend (Piano)', 'Here Comes the Sun — The Beatles'
          ],
          cocktail: [
            'Lovely Day — Bill Withers', 'Sunday Morning — Maroon 5', 'Put Your Records On — Corinne Bailey Rae', 'Banana Pancakes — Jack Johnson', 'Better Together — Jack Johnson'
          ],
          firstDance: [
            'At Last — Etta James', 'Perfect — Ed Sheeran', 'All of Me — John Legend', 'Thinking Out Loud — Ed Sheeran', 'Unchained Melody — The Righteous Brothers'
          ],
          reception: [
            'Uptown Funk — Bruno Mars', 'Dancing Queen — ABBA', 'September — Earth Wind & Fire', 'Shut Up and Dance — Walk the Moon', 'Happy — Pharrell Williams', 'I Wanna Dance With Somebody — Whitney Houston'
          ]
        };
      }
    },
    hashtags: {
      label: 'Wedding Hashtags',
      desc: 'Creative hashtag suggestions for social media',
      icon: 'fa-hashtag',
      generate: function() {
        var d = AIWeddingPlanner.getWeddingData();
        var g = (d.groomName || 'Groom').replace(/\s/g, '').toLowerCase();
        var b = (d.brideName || 'Bride').replace(/\s/g, '').toLowerCase();
        var hash = function(h) { return '#' + h; };
        var tags = [
          g + 'And' + b + 'Forever', g + 'Weds' + b, 'HappilyEver' + g + b,
          'The' + g + b + 'Wedding', g + b + 'TieTheKnot', 'Love' + g + b,
          'MrAndMrs' + g + b.charAt(0).toUpperCase() + b.slice(1),
          g + b + '2026', 'Forever' + g + b, g + 'Loves' + b
        ];
        return tags.map(hash);
      }
    },
    vows: {
      label: 'Wedding Vows',
      desc: 'Generate personalized wedding vows',
      icon: 'fa-heart',
      generate: function() {
        var d = AIWeddingPlanner.getWeddingData();
        var g = d.groomName || 'you';
        var b = d.brideName || 'you';
        var vows = [
          'I, ' + g + ', take you, ' + b + ', to be my partner in life. I promise to love you unconditionally, to support your dreams, and to stand by your side through every joy and every challenge. With this ring, I give you my heart, my loyalty, and my forever.',
          'From this day forward, I choose you to be my beloved. I vow to laugh with you in good times, to comfort you in hard times, and to cherish you always. You are my greatest adventure, my safest harbor, and my most beautiful blessing.',
          'Before God, our families, and our friends, I pledge my love to you. I will be your strength when you are weak, your light when darkness falls, and your peace when the world is loud. My love for you is eternal, my commitment unbreakable.',
          'I promise to be your partner, your best friend, and your biggest cheerleader. I will love you on sunny days and stormy nights. I will hold your hand through it all, because with you, I have found my home. Today, tomorrow, and always — I am yours.'
        ];
        return vows[Math.floor(Math.random() * vows.length)];
      }
    },
    speeches: {
      label: 'Wedding Speeches',
      desc: 'Generate toasts & speeches for your wedding party',
      icon: 'fa-microphone',
      generate: function() {
        var speeches = [
          'Good evening everyone! For those who don\'t know me, I\'m [Name], and I\'ve had the privilege of knowing the happy couple for [X] years. When I first met [Groom/Bride], I knew they were special — but I never imagined they\'d find someone who completes them so perfectly. [Partner], you are the missing piece of their puzzle, and watching your love grow has been one of the greatest joys of my life. Please join me in raising a glass to the happy couple!',
          'Love is a lot like a good wine — it gets better with time, and it brings people together. Today, we\'ve witnessed something truly beautiful: two souls becoming one. [Couple], your love inspires everyone in this room. May your marriage be filled with laughter, adventure, and endless happiness. Cheers!',
          'They say the best love stories are the ones that catch you by surprise. [Groom/Bride], you never told me you were looking for love, but clearly love was looking for you. [Partner], you are the answer to prayers we didn\'t know [Groom/Bride] was praying. Here\'s to a lifetime of happiness, inside jokes, and growing old together!'
        ];
        return speeches[Math.floor(Math.random() * speeches.length)];
      }
    },
    thankYou: {
      label: 'Thank-You Messages',
      desc: 'Generate heartfelt thank-you notes',
      icon: 'fa-envelope',
      generate: function() {
        var messages = [
          'Thank you from the bottom of our hearts for celebrating our special day with us. Your presence, love, and generous blessings made our wedding truly unforgettable. We are so grateful to have you in our lives.',
          'We are overwhelmed with gratitude for your love and support on our wedding day. Your kind words and thoughtful gifts touched our hearts deeply. Thank you for being part of our joy.',
          'Our wedding day was everything we dreamed of, and having you there made it perfect. Thank you for your warm wishes, your beautiful presence, and your generous gifts. We love you!'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
    },
    invitation: {
      label: 'Invitation Wording',
      desc: 'Generate elegant invitation text',
      icon: 'fa-scroll',
      generate: function() {
        var d = AIWeddingPlanner.getWeddingData();
        var g = d.groomName || 'Groom';
        var b = d.brideName || 'Bride';
        var date = d.weddingDate || d.date || 'our wedding date';
        var venue = d.venue || 'the venue';
        var wordings = [
          'Together with their families, ' + g + ' & ' + b + ' invite you to share in the joy of their wedding. Join us as we exchange vows and begin our journey as husband and wife on ' + date + ' at ' + venue + '. Your presence is the greatest gift of all.',
          'Love has brought us together, and we would be honored to have you celebrate with us. ' + g + ' & ' + b + ' request the pleasure of your company at their wedding ceremony on ' + date + ' at ' + venue + '.',
          'With hearts full of love, ' + g + ' & ' + b + ' invite you to witness their union in marriage. Please join them for a celebration of love, faith, and happily ever after on ' + date + ' at ' + venue + '.'
        ];
        return wordings[Math.floor(Math.random() * wordings.length)];
      }
    },
    guestQA: {
      label: 'Guest Q&A',
      desc: 'Answer common guest questions',
      icon: 'fa-question-circle',
      generate: function() {
        var d = AIWeddingPlanner.getWeddingData();
        var venue = d.venue || 'our venue';
        var city = d.city || 'our city';
        return [
          { q: 'What time should I arrive?', a: 'We recommend arriving 30 minutes before the ceremony start time to find your seat and enjoy the atmosphere.' },
          { q: 'Is there parking available?', a: 'Yes, complimentary parking is available at ' + venue + '. Valet service will also be provided.' },
          { q: 'What is the dress code?', a: 'The dress code is formal/black tie. We encourage our guests to dress elegantly for this special occasion.' },
          { q: 'Can I bring a plus one?', a: 'Please refer to your invitation for plus-one details. If you have questions, contact us directly.' },
          { q: 'Are children invited?', a: 'While we love your little ones, this will be an adults-only celebration except for children in the wedding party.' },
          { q: 'What will the weather be like?', a: 'The wedding is in ' + city + ', so expect pleasant weather. The venue is climate-controlled for your comfort.' },
          { q: 'Where should I stay?', a: 'We have room blocks at nearby hotels. Check the travel section of our website for details and discount codes.' }
        ];
      }
    }
  },

  getWeddingData: function() {
    try {
      var raw = localStorage.getItem('_fb_weddingInfo_main');
      if (raw) return JSON.parse(raw);
      raw = localStorage.getItem('weddingData');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return window.weddingData || {};
  },

  addMins: function(timeStr, mins) {
    if (!timeStr) return '--:--';
    var parts = timeStr.split(':');
    var h = parseInt(parts[0]) || 0;
    var m = parseInt(parts[1]) || 0;
    var total = h * 60 + m + mins;
    h = Math.floor(total / 60) % 24;
    m = total % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  },

  open: function(category) {
    var existing = document.getElementById('aiPlannerModal');
    if (existing) existing.remove();

    var cat = this.categories[category];
    if (!cat) return;

    var overlay = document.createElement('div');
    overlay.id = 'aiPlannerModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(5,11,24,0.92);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:20px;animation:plannerIn 0.3s ease;cursor:pointer;';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    var box = document.createElement('div');
    box.style.cssText = 'max-width:650px;width:100%;max-height:85vh;overflow-y:auto;padding:40px 32px;background:linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(212,175,55,0.15);border-radius:24px;cursor:default;position:relative;';
    box.style.scrollbarWidth = 'thin';

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:12px;right:16px;background:none;border:none;color:rgba(255,255,255,0.2);font-size:1.8rem;cursor:pointer;transition:color 0.3s;';
    closeBtn.onmouseover = function() { this.style.color = '#fff'; };
    closeBtn.onmouseout = function() { this.style.color = 'rgba(255,255,255,0.2)'; };
    closeBtn.onclick = function() { overlay.remove(); };
    box.appendChild(closeBtn);

    var title = document.createElement('div');
    title.style.cssText = 'font-family:\'Playfair Display\',serif;font-size:1.4rem;color:#D4AF37;margin-bottom:4px;';
    title.innerHTML = '<i class="fas ' + cat.icon + '" style="margin-right:8px;"></i>' + cat.label;
    box.appendChild(title);

    var desc = document.createElement('p');
    desc.style.cssText = 'font-family:\'Inter\',sans-serif;font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.06);';
    desc.textContent = cat.desc;
    box.appendChild(desc);

    var content = document.createElement('div');
    content.id = 'plannerContent';
    content.style.cssText = 'font-family:\'Inter\',sans-serif;font-size:0.88rem;color:var(--text);line-height:1.7;';
    box.appendChild(content);

    var actionRow = document.createElement('div');
    actionRow.style.cssText = 'display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(212,175,55,0.06);';

    var genBtn = document.createElement('button');
    genBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate';
    genBtn.style.cssText = 'padding:12px 28px;border-radius:50px;background:linear-gradient(135deg,#D4AF37,#B8962E);color:#050B18;font-family:\'Inter\',sans-serif;font-size:0.8rem;font-weight:600;border:none;cursor:pointer;transition:all 0.3s;';
    genBtn.onmouseover = function() { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 8px 25px rgba(212,175,55,0.3)'; };
    genBtn.onmouseout = function() { this.style.transform = ''; this.style.boxShadow = ''; };
    genBtn.onclick = function() {
      content.innerHTML = '<div style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#D4AF37;display:block;margin-bottom:12px;"></i><span style="color:var(--text-muted);">Generating...</span></div>';
      setTimeout(function() {
        AIWeddingPlanner.renderContent(content, category);
      }, 600);
    };
    actionRow.appendChild(genBtn);

    var closeBtn2 = document.createElement('button');
    closeBtn2.textContent = 'Close';
    closeBtn2.style.cssText = 'padding:12px 28px;border-radius:50px;background:transparent;border:1px solid rgba(212,175,55,0.15);color:#D4AF37;font-family:\'Inter\',sans-serif;font-size:0.8rem;cursor:pointer;transition:all 0.3s;';
    closeBtn2.onmouseover = function() { this.style.background = 'rgba(212,175,55,0.06)'; };
    closeBtn2.onmouseout = function() { this.style.background = 'transparent'; };
    closeBtn2.onclick = function() { overlay.remove(); };
    actionRow.appendChild(closeBtn2);
    box.appendChild(actionRow);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var style = document.createElement('style');
    style.textContent = '@keyframes plannerIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}';
    document.head.appendChild(style);

    // Auto-generate
    setTimeout(function() {
      content.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:#D4AF37;display:block;margin-bottom:10px;"></i><span style="color:var(--text-muted);font-size:0.8rem;">Loading ' + cat.label.toLowerCase() + '...</span></div>';
      setTimeout(function() { AIWeddingPlanner.renderContent(content, category); }, 500);
    }, 200);
  },

  renderContent: function(container, category) {
    var data = this.categories[category].generate();
    var html = '';

    switch(category) {
      case 'timeline':
        html = '<div style="display:grid;gap:8px;">' + data.map(function(item) {
          return '<div style="display:flex;gap:14px;padding:12px 14px;background:rgba(255,255,255,0.02);border-radius:10px;border-left:3px solid #D4AF37;align-items:flex-start;"><div style="font-family:\'Playfair Display\',serif;font-size:0.85rem;color:#D4AF37;white-space:nowrap;min-width:50px;font-weight:600;">' + item.time + '</div><div><div style="font-weight:500;color:var(--text);">' + item.event + '</div><div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">' + item.note + '</div></div></div>';
        }).join('') + '</div>';
        break;
      case 'decoration':
        html = '<div style="text-align:center;padding:24px;background:rgba(212,175,55,0.04);border-radius:16px;border:1px solid rgba(212,175,55,0.08);"><div style="font-family:\'Playfair Display\',serif;font-size:1.3rem;color:#D4AF37;margin-bottom:8px;">' + data.name + '</div><div style="color:var(--text-light);font-size:0.85rem;margin-bottom:6px;"><strong style="color:#D4AF37;">Palette:</strong> ' + data.palette + '</div><div style="color:var(--text-light);font-size:0.85rem;"><strong style="color:#D4AF37;">Elements:</strong> ' + data.elements + '</div></div>';
        break;
      case 'palette':
        html = '<div style="text-align:center;"><div style="font-family:\'Playfair Display\',serif;font-size:1.2rem;color:#D4AF37;margin-bottom:12px;">' + data.name + '</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' + data.colors.map(function(c) {
          return '<div style="width:60px;height:60px;border-radius:12px;background:' + c + ';border:2px solid rgba(255,255,255,0.06);box-shadow:0 4px 12px rgba(0,0,0,0.2);" title="' + c + '"></div>';
        }).join('') + '</div></div>';
        break;
      case 'music':
        html = Object.keys(data).map(function(section) {
          return '<div style="margin-bottom:14px;"><div style="font-family:\'Playfair Display\',serif;font-size:0.95rem;color:#D4AF37;margin-bottom:6px;text-transform:capitalize;">' + section.replace(/([A-Z])/g, ' $1') + '</div><div style="display:grid;gap:4px;">' + data[section].map(function(song) {
            return '<div style="padding:6px 12px;background:rgba(255,255,255,0.02);border-radius:6px;color:var(--text-light);font-size:0.82rem;">&#9835; ' + song + '</div>';
          }).join('') + '</div></div>';
        }).join('');
        break;
      case 'hashtags':
        html = '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">' + data.map(function(tag) {
          return '<span style="padding:8px 16px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.1);border-radius:50px;color:#D4AF37;font-size:0.82rem;cursor:pointer;transition:all 0.3s;" onclick="var t=this.textContent;if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){if(window.showNotification)showNotification(\'Copied: \'+t,\'success\');});">' + tag + '</span>';
        }).join('') + '</div>';
        break;
      case 'vows':
      case 'speeches':
      case 'thankYou':
      case 'invitation':
        html = '<div style="padding:24px;background:rgba(212,175,55,0.03);border-radius:16px;border:1px solid rgba(212,175,55,0.08);line-height:1.9;font-style:italic;color:var(--text);font-size:0.9rem;">"' + data + '"</div>';
        break;
      case 'guestQA':
        html = '<div style="display:grid;gap:10px;">' + data.map(function(item) {
          return '<div style="padding:12px 14px;background:rgba(255,255,255,0.02);border-radius:10px;"><div style="color:#D4AF37;font-weight:500;font-size:0.85rem;margin-bottom:3px;"><i class="fas fa-question-circle" style="margin-right:6px;"></i>' + item.q + '</div><div style="color:var(--text-light);font-size:0.8rem;padding-left:22px;">' + item.a + '</div></div>';
        }).join('') + '</div>';
        break;
    }
    container.innerHTML = html;
  },

  init: function() {
    if (document.getElementById('aiPlannerFAB')) return;
    if (document.getElementById('floatingPanel')) return;
    var fab = document.createElement('button');
    fab.id = 'aiPlannerFAB';
    fab.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>';
    fab.title = 'AI Wedding Planner';
    fab.style.cssText = 'position:fixed;bottom:150px;right:20px;z-index:998;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#B8962E);color:#050B18;border:none;font-size:1.2rem;cursor:pointer;box-shadow:0 4px 20px rgba(212,175,55,0.3);transition:all 0.3s;display:flex;align-items:center;justify-content:center;';
    fab.onmouseover = function() { this.style.transform = 'scale(1.1)'; this.style.boxShadow = '0 8px 30px rgba(212,175,55,0.45)'; };
    fab.onmouseout = function() { this.style.transform = ''; this.style.boxShadow = ''; };
    fab.onclick = function() { AIWeddingPlanner.showMenu(); };
    document.body.appendChild(fab);
  },

  showMenu: function() {
    var existing = document.getElementById('aiPlannerModal');
    if (existing) { existing.remove(); return; }

    var overlay = document.createElement('div');
    overlay.id = 'aiPlannerModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(5,11,24,0.92);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:20px;animation:plannerIn 0.3s ease;cursor:pointer;';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    var box = document.createElement('div');
    box.style.cssText = 'max-width:550px;width:100%;max-height:85vh;overflow-y:auto;padding:40px 32px;background:linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(212,175,55,0.15);border-radius:24px;cursor:default;position:relative;';

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:12px;right:16px;background:none;border:none;color:rgba(255,255,255,0.2);font-size:1.8rem;cursor:pointer;transition:color 0.3s;z-index:1;';
    closeBtn.onmouseover = function() { this.style.color = '#fff'; };
    closeBtn.onmouseout = function() { this.style.color = 'rgba(255,255,255,0.2)'; };
    closeBtn.onclick = function() { overlay.remove(); };
    box.appendChild(closeBtn);

    var title = document.createElement('div');
    title.style.cssText = 'font-family:\'Playfair Display\',serif;font-size:1.5rem;color:#D4AF37;margin-bottom:4px;text-align:center;';
    title.innerHTML = '<i class="fas fa-wand-magic-sparkles" style="margin-right:8px;"></i>AI Wedding Planner';
    box.appendChild(title);

    var subtitle = document.createElement('p');
    subtitle.style.cssText = 'text-align:center;font-family:\'Inter\',sans-serif;font-size:0.82rem;color:rgba(255,255,255,0.4);margin-bottom:24px;';
    subtitle.textContent = 'Let AI assist you with your wedding planning';
    box.appendChild(subtitle);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    var cats = this.categories;
    Object.keys(cats).forEach(function(key) {
      var c = cats[key];
      var card = document.createElement('div');
      card.style.cssText = 'padding:18px 14px;background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.06);border-radius:14px;text-align:center;cursor:pointer;transition:all 0.3s;';
      card.onmouseover = function() { this.style.borderColor = 'rgba(212,175,55,0.25)'; this.style.background = 'rgba(212,175,55,0.04)'; };
      card.onmouseout = function() { this.style.borderColor = 'rgba(212,175,55,0.06)'; this.style.background = 'rgba(255,255,255,0.02)'; };
      card.onclick = function() { overlay.remove(); setTimeout(function() { AIWeddingPlanner.open(key); }, 200); };
      card.innerHTML = '<div style="font-size:1.5rem;color:#D4AF37;margin-bottom:6px;"><i class="fas ' + c.icon + '"></i></div><div style="font-family:\'Inter\',sans-serif;font-size:0.78rem;color:var(--text);font-weight:500;">' + c.label + '</div>';
      grid.appendChild(card);
    });

    box.appendChild(grid);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var style = document.createElement('style');
    style.textContent = '@keyframes plannerIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}';
    document.head.appendChild(style);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  AIWeddingPlanner.init();
});