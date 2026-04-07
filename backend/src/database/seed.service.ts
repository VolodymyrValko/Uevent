import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/user.entity';
import { Company } from '../modules/companies/company.entity';
import { Event, EventFormat, EventTheme } from '../modules/events/event.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.eventsRepo.count();

    if (count > 0) {
      await this.refreshSeedEventDates();
      return;
    }

    const adminPassword = await bcrypt.hash('admin123', 10);
    let admin = await this.usersRepo.findOne({ where: { email: 'admin@uevent.demo' } });
    if (!admin) {
      admin = await this.usersRepo.save(
        this.usersRepo.create({
          email: 'admin@uevent.demo',
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'Uevent',
          role: UserRole.ADMIN,
          isEmailConfirmed: true,
        }),
      );
    }

    const orgPassword = await bcrypt.hash('organizer123', 10);
    let organizer = await this.usersRepo.findOne({ where: { email: 'organizer@uevent.demo' } });
    if (!organizer) {
      organizer = await this.usersRepo.save(
        this.usersRepo.create({
          email: 'organizer@uevent.demo',
          password: orgPassword,
          firstName: 'Event',
          lastName: 'Organizer',
          role: UserRole.USER,
          isEmailConfirmed: true,
        }),
      );
    }

    const companiesData = [
      {
        name: 'TechConf Inc.',
        email: 'info@techconf.demo',
        description: 'Premier technology conference organizer',
        location: 'Kyiv, Ukraine',
        userId: organizer.id,
      },
      {
        name: 'BizWorld Events',
        email: 'hello@bizworld.demo',
        description: 'Business networking and growth events',
        location: 'Lviv, Ukraine',
        userId: admin.id,
      },
    ];

    const companies: Company[] = [];
    for (const data of companiesData) {
      let company = await this.companiesRepo.findOne({ where: { email: data.email } });
      if (!company) {
        company = await this.companiesRepo.save(this.companiesRepo.create(data));
      }
      companies.push(company);
    }

    const [techCo, bizCo] = companies;

    const future = (days: number, hours = 10): Date => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hours, 0, 0, 0);
      return d;
    };

    const P = {
      techConf:   'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      workshop:   'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
      business:   'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&q=80',
      startup:    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
      science:    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&q=80',
      space:      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
      psychology: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
      politics:   'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',
      musicFest:  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
      gaming:     'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
      lecture:    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80',
      networking: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80',
    };

    const eventsData: Partial<Event>[] = [

      {
        title: 'TypeScript Summit 2026',
        description: 'The biggest TypeScript conference in Eastern Europe. Deep-dives into advanced types, compiler internals, and real-world patterns. Featuring 12 talks from core contributors.',
        format: EventFormat.CONFERENCE,
        theme: EventTheme.TECHNOLOGY,
        date: future(14),
        location: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
        price: 49.99,
        maxTickets: 500,
        companyId: techCo.id,
        poster: P.techConf,
      },
      {
        title: 'React & Next.js Workshop',
        description: 'Hands-on workshop covering React 19 concurrent features, Server Components, and Next.js 15 App Router. Build a production-ready app from scratch.',
        format: EventFormat.WORKSHOP,
        theme: EventTheme.TECHNOLOGY,
        date: future(7),
        location: 'Lviv, Ukraine',
        latitude: 49.8397,
        longitude: 24.0297,
        price: 29.99,
        maxTickets: 30,
        companyId: techCo.id,
        poster: P.workshop,
      },
      {
        title: 'AI & Machine Learning Lecture',
        description: 'Explore the latest breakthroughs in AI: LLM fine-tuning, retrieval-augmented generation, and practical deployment strategies for production ML systems.',
        format: EventFormat.LECTURE,
        theme: EventTheme.TECHNOLOGY,
        date: future(10),
        location: 'Kharkiv, Ukraine',
        latitude: 49.9935,
        longitude: 36.2304,
        price: 0,
        maxTickets: 200,
        companyId: bizCo.id,
        poster: P.lecture,
      },
      {
        title: 'DevFest Ukraine 2026',
        description: 'Annual Google Developer Festival celebrating open source, cloud, and community. Workshops, lightning talks, and networking with 800+ developers.',
        format: EventFormat.FEST,
        theme: EventTheme.TECHNOLOGY,
        date: future(30),
        location: 'Odesa, Ukraine',
        latitude: 46.4825,
        longitude: 30.7233,
        price: 19.99,
        maxTickets: 800,
        companyId: techCo.id,
        poster: P.networking,
      },

      {
        title: 'Startup Founders Conference',
        description: 'Connect with 200+ startup founders, investors, and mentors. Pitch competitions, funding workshops, and one-on-one investor meetings.',
        format: EventFormat.CONFERENCE,
        theme: EventTheme.BUSINESS,
        date: future(21),
        location: 'Kyiv, Ukraine',
        latitude: 50.4547,
        longitude: 30.5238,
        price: 79.99,
        maxTickets: 300,
        companyId: bizCo.id,
        poster: P.startup,
      },
      {
        title: 'Product Management Workshop',
        description: 'Master product discovery, OKRs, and prioritization frameworks. Learn from PMs at top companies through practical exercises and real case studies.',
        format: EventFormat.WORKSHOP,
        theme: EventTheme.BUSINESS,
        date: future(9),
        location: 'Lviv, Ukraine',
        latitude: 49.8397,
        longitude: 24.0297,
        price: 39.99,
        maxTickets: 40,
        companyId: bizCo.id,
        poster: P.workshop,
      },
      {
        title: 'Growth Hacking Masterclass',
        description: 'Proven growth strategies from 0 to 100K users. SEO, viral loops, retention mechanics, and data-driven experimentation explained with real examples.',
        format: EventFormat.LECTURE,
        theme: EventTheme.BUSINESS,
        date: future(5),
        location: 'Dnipro, Ukraine',
        latitude: 48.4647,
        longitude: 35.0462,
        price: 15.00,
        maxTickets: 150,
        companyId: bizCo.id,
        poster: P.business,
      },

      {
        title: 'Quantum Computing Conference',
        description: 'Cutting-edge research in quantum algorithms, error correction, and near-term quantum advantage. Academic and industry speakers from CERN, IBM, and Google.',
        format: EventFormat.CONFERENCE,
        theme: EventTheme.SCIENCE,
        date: future(25),
        location: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
        price: 60.00,
        maxTickets: 250,
        companyId: techCo.id,
        poster: P.science,
      },
      {
        title: 'Space Exploration Lecture Night',
        description: 'Fascinating talk on the Artemis program, private space race, and humanity\'s roadmap to Mars. Open Q&A with aerospace engineers.',
        format: EventFormat.LECTURE,
        theme: EventTheme.SCIENCE,
        date: future(12),
        location: 'Kharkiv, Ukraine',
        latitude: 49.9935,
        longitude: 36.2304,
        price: 0,
        maxTickets: 300,
        companyId: bizCo.id,
        poster: P.space,
      },
      {
        title: 'BioHack Workshop',
        description: 'Intro to synthetic biology, CRISPR basics, and DIY biohacking. Hands-on lab sessions with microscopes, DNA extraction, and more.',
        format: EventFormat.WORKSHOP,
        theme: EventTheme.SCIENCE,
        date: future(18),
        location: 'Lviv, Ukraine',
        latitude: 49.8397,
        longitude: 24.0297,
        price: 45.00,
        maxTickets: 20,
        companyId: techCo.id,
        poster: P.science,
      },

      {
        title: 'Mind & Performance Conference',
        description: 'Evidence-based strategies for peak mental performance: flow states, cognitive bias mitigation, and stress resilience from neuroscience researchers.',
        format: EventFormat.CONFERENCE,
        theme: EventTheme.PSYCHOLOGY,
        date: future(20),
        location: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
        price: 35.00,
        maxTickets: 400,
        companyId: bizCo.id,
        poster: P.psychology,
      },
      {
        title: 'Emotional Intelligence Workshop',
        description: 'Practical EQ development: self-awareness, empathy, conflict de-escalation, and leadership communication. Small groups of 15 for deep practice.',
        format: EventFormat.WORKSHOP,
        theme: EventTheme.PSYCHOLOGY,
        date: future(11),
        location: 'Odesa, Ukraine',
        latitude: 46.4825,
        longitude: 30.7233,
        price: 29.99,
        maxTickets: 15,
        companyId: bizCo.id,
        poster: P.psychology,
      },
      {
        title: 'Burnout & Resilience: a Lecture',
        description: 'Psychologist Dr. Olena Kovalenko shares research-backed tools to prevent burnout, recover from exhaustion, and build lasting mental resilience.',
        format: EventFormat.LECTURE,
        theme: EventTheme.PSYCHOLOGY,
        date: future(6),
        location: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
        price: 0,
        maxTickets: 200,
        companyId: bizCo.id,
        poster: P.lecture,
      },

      {
        title: 'Democracy & Digital Society Forum',
        description: 'Experts discuss disinformation, digital rights, AI in governance, and the future of democratic institutions in the age of social media.',
        format: EventFormat.CONFERENCE,
        theme: EventTheme.POLITICS,
        date: future(35),
        location: 'Kyiv, Ukraine',
        latitude: 50.4547,
        longitude: 30.5238,
        price: 25.00,
        maxTickets: 300,
        companyId: bizCo.id,
        poster: P.politics,
      },
      {
        title: 'Civic Tech Workshop',
        description: 'Build tools for civic engagement: open data, e-governance platforms, and participatory democracy apps. Ideal for developers and policy enthusiasts.',
        format: EventFormat.WORKSHOP,
        theme: EventTheme.POLITICS,
        date: future(22),
        location: 'Lviv, Ukraine',
        latitude: 49.8397,
        longitude: 24.0297,
        price: 10.00,
        maxTickets: 50,
        companyId: techCo.id,
        poster: P.politics,
      },

      {
        title: 'Indie Game Dev Fest 2026',
        description: 'Showcase and play 50+ indie games, meet developers, attend talks on game design, publishing, and monetization. The top game wins a €5000 prize.',
        format: EventFormat.FEST,
        theme: EventTheme.ENTERTAINMENT,
        date: future(28),
        location: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
        price: 12.00,
        maxTickets: 1000,
        companyId: techCo.id,
        poster: P.gaming,
      },
      {
        title: 'Creative Coding Workshop',
        description: 'Turn code into art! Learn p5.js, generative visuals, and interactive audio-reactive installations. No prior creative experience needed.',
        format: EventFormat.WORKSHOP,
        theme: EventTheme.ENTERTAINMENT,
        date: future(15),
        location: 'Kharkiv, Ukraine',
        latitude: 49.9935,
        longitude: 36.2304,
        price: 20.00,
        maxTickets: 25,
        companyId: techCo.id,
        poster: P.workshop,
      },
      {
        title: 'Tech & Comedy Night',
        description: 'Stand-up comedians and tech professionals team up for a night of laughs about bugs, deadlines, and startup life. Open bar included.',
        format: EventFormat.OTHER,
        theme: EventTheme.ENTERTAINMENT,
        date: future(8),
        location: 'Odesa, Ukraine',
        latitude: 46.4825,
        longitude: 30.7233,
        price: 18.00,
        maxTickets: 120,
        companyId: bizCo.id,
        poster: P.musicFest,
      },

      {
        title: 'Open Source Hackathon',
        description: '48-hour hackathon to contribute to popular open source projects. Teams of 2–5. Prizes for best contribution, best newcomer, and most creative solution.',
        format: EventFormat.OTHER,
        theme: EventTheme.TECHNOLOGY,
        date: future(40),
        location: 'Kyiv, Ukraine',
        latitude: 50.4501,
        longitude: 30.5234,
        price: 0,
        maxTickets: 200,
        companyId: techCo.id,
        poster: P.techConf,
      },
      {
        title: 'Women in Tech Meetup',
        description: 'Networking, mentorship speed-rounds, and inspiring talks from women leading engineering and product teams. All genders welcome as allies.',
        format: EventFormat.OTHER,
        theme: EventTheme.TECHNOLOGY,
        date: future(17),
        location: 'Lviv, Ukraine',
        latitude: 49.8397,
        longitude: 24.0297,
        price: 0,
        maxTickets: 100,
        companyId: bizCo.id,
        poster: P.networking,
      },
    ];

    for (const data of eventsData) {
      await this.eventsRepo.save(this.eventsRepo.create(data as Event));
    }

  }

  private async refreshSeedEventDates(): Promise<void> {
    const now = new Date();
    const pastEvents = await this.eventsRepo.find({
      where: { date: require('typeorm').LessThanOrEqual(now) },
    });

    for (const event of pastEvents) {

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 14 + Math.floor(Math.random() * 30));
      newDate.setHours(10, 0, 0, 0);
      event.date = newDate;
      event.publishDate = null;
      await this.eventsRepo.save(event);
    }
  }
}
